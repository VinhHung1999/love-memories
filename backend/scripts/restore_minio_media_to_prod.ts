// Capture and clear DATABASE_URL BEFORE any other import. Prisma's
// `src/utils/prisma.ts` singleton instantiates PrismaClient at import
// time, and `new PrismaClient()` auto-loads `backend/.env` via dotenv,
// which populates `process.env.DATABASE_URL` with the prod URL — past
// the guard's reach. By capturing + deleting here, we read the
// caller-provided value, run the guard against it, then construct a
// fresh PrismaClient with an EXPLICIT `datasourceUrl` so dotenv
// auto-load can't sneak the prod URL in regardless. Bypassing the
// `prisma` singleton on purpose for the same reason.
const CAPTURED_DB_URL = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// 2026-04-28 PROD DATA-LOSS RECOVERY (Phase 3 — D11 incident).
//
// `deploy up memoura-api --env prod` ran `npm test` pre-deploy with a
// shell-leaked prod DATABASE_URL → Jest's afterAll deleteMany() wiped
// Boss couple's moments + letters + photos. Image objects on the local
// MinIO bucket survived because the test suite only deleted DB rows,
// not the underlying CDN files. This script reads every image in
// `/Volumes/HungHDD/minio-data/love-scrum/{images,others}/`, clusters
// by 30-min upload-time proximity (split also at 5 photos / moment),
// and inserts one moment + linked moment_photo rows per cluster.
//
// AUDIO + non-image files DEFERRED to Phase 3B once Boss confirms the
// moments-only path renders correctly.
//
// USAGE — DRY-RUN by default:
//   cd backend && DATABASE_URL=postgresql://hungphu@localhost:5433/love_scrum \
//     npx tsx scripts/restore_minio_media_to_prod.ts
// → logs the planned clusters + insert counts, no DB writes.
//
// LIVE — explicit opt-in:
//   cd backend && DRY_RUN=false \
//     DATABASE_URL=postgresql://hungphu@localhost:5433/love_scrum \
//     npx tsx scripts/restore_minio_media_to_prod.ts
//
// SAFETY:
//   • Hard guard: DATABASE_URL must include 'love_scrum' AND NOT include
//     '_dev' AND mention port 5433. Refuses dev/test/staging DBs (this
//     is a prod-only recovery script, inverse of the usual seed guard).
//   • Idempotent: each cluster is skipped if all of its photo URLs
//     already exist in `moment_photos`. Re-running after a partial
//     execution is safe.
//   • DRY_RUN default = true → script prints the plan + exits 0 without
//     touching the DB. Operator must explicitly set DRY_RUN=false to
//     execute.

// ── Hard env guards (belt + suspenders) ─────────────────────────────
const DB_URL = CAPTURED_DB_URL ?? '';
const guardChecks = {
  hasProdDbName: DB_URL.includes('love_scrum'),
  notDev: !DB_URL.includes('_dev'),
  prodPort: DB_URL.includes(':5433'),
};
if (!guardChecks.hasProdDbName || !guardChecks.notDev || !guardChecks.prodPort) {
  console.error(
    '[restore_minio] REFUSING — DATABASE_URL must target prod love_scrum on :5433.\n' +
      `  got: ${DB_URL || '(unset)'}\n` +
      `  guard: ${JSON.stringify(guardChecks)}\n` +
      '  expected: postgresql://hungphu@localhost:5433/love_scrum',
  );
  process.exit(1);
}

// Construct PrismaClient with the EXPLICIT validated URL. Bypasses
// the `src/utils/prisma.ts` singleton (which would auto-load `.env`
// via dotenv) and any residual env loading.
const prisma = new PrismaClient({ datasourceUrl: DB_URL });

const DRY_RUN = process.env.DRY_RUN !== 'false';

// ── Constants (Boss spec 2026-04-28) ────────────────────────────────
const MINIO_ROOT = '/Volumes/HungHDD/minio-data/love-scrum';
const CDN_BASE = 'https://cdn-service.hungphu.work/f/love-scrum';

// 30-minute proximity window. Two consecutive uploads with a gap of
// less than this fall into the same moment; a longer gap starts a new
// moment. Combined with MAX_PHOTOS_PER_MOMENT below, whichever fires
// first triggers the split.
const PROXIMITY_GAP_MS = 30 * 60 * 1000;
const MAX_PHOTOS_PER_MOMENT = 5;

const BOSS_COUPLE = 'c7499c7a-4861-4ccd-b4a7-8187bd5bf0ae';
// All reconstructed moments author = Boss per spec 2026-04-28
// (simpler than parity-alternation; Boss can manually re-attribute via
// mobile UI after if anything was actually Partner-uploaded).
const BOSS_USER = 'e5d1316c-2712-4b64-874f-a6fb67c04c56';

// Subdirs the script scans. Audio + non-image content in `audio/` is
// skipped this pass — Phase 3B will revisit once moments are
// validated. `others/` mixes images + videos; we keep the images and
// drop everything else.
const SUBDIRS = ['images', 'others'] as const;

// Image-only whitelist per Boss spec. Anything not in this set is
// skipped (logged in the summary so we know what was left out).
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'heic', 'webp']);

type ParsedFile = {
  epochMs: number;
  filename: string;
  subdir: (typeof SUBDIRS)[number];
  url: string;
};

function parseFilename(filename: string, subdir: (typeof SUBDIRS)[number]): ParsedFile | null {
  // Format: <epochMs>-<originalName>.<ext>
  const m = /^(\d{10,16})-(.+)\.([A-Za-z0-9]+)$/.exec(filename);
  if (!m) return null;
  const epochMs = Number(m[1]);
  const ext = m[3]!.toLowerCase();
  if (!Number.isFinite(epochMs)) return null;
  if (!IMAGE_EXT.has(ext)) return null;
  return {
    epochMs,
    filename,
    subdir,
    url: `${CDN_BASE}/${subdir}/${filename}`,
  };
}

function listImages(): { kept: ParsedFile[]; skippedExts: string[] } {
  const out: ParsedFile[] = [];
  const skippedExts = new Set<string>();
  for (const subdir of SUBDIRS) {
    const dir = path.join(MINIO_ROOT, subdir);
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const f of entries) {
      if (f.startsWith('.')) continue;
      // MinIO stores each object as a directory whose NAME is the
      // user-facing filename (xl.meta inside). Treat every named
      // entry as a "file" — only the filename pattern + extension
      // whitelist decide whether we keep it.
      const parsed = parseFilename(f, subdir);
      if (parsed) {
        out.push(parsed);
      } else {
        const m = /\.([A-Za-z0-9]+)$/.exec(f);
        if (m) skippedExts.add(m[1]!.toLowerCase());
      }
    }
  }
  return { kept: out, skippedExts: [...skippedExts] };
}

type Cluster = {
  startMs: number;
  endMs: number;
  files: ParsedFile[];
};

function clusterByProximity(files: ParsedFile[]): Cluster[] {
  // Sort ascending by upload time.
  const sorted = [...files].sort((a, b) => a.epochMs - b.epochMs);
  const clusters: Cluster[] = [];
  for (const f of sorted) {
    const last = clusters[clusters.length - 1];
    // Start a new cluster when EITHER:
    //   (a) gap from previous file > PROXIMITY_GAP_MS, OR
    //   (b) current cluster is full (MAX_PHOTOS_PER_MOMENT)
    if (
      !last ||
      f.epochMs - last.endMs > PROXIMITY_GAP_MS ||
      last.files.length >= MAX_PHOTOS_PER_MOMENT
    ) {
      clusters.push({ startMs: f.epochMs, endMs: f.epochMs, files: [f] });
    } else {
      last.endMs = f.epochMs;
      last.files.push(f);
    }
  }
  return clusters;
}

(async () => {
  const { kept, skippedExts } = listImages();

  console.log(
    `[restore_minio] Found ${kept.length} image files in ${MINIO_ROOT} ` +
      `(image-only pass per spec)`,
  );
  if (skippedExts.length > 0) {
    console.log(
      `  Skipped non-image exts (deferred to Phase 3B): ${skippedExts.join(', ')}`,
    );
  }

  const clusters = clusterByProximity(kept);
  console.log(
    `[restore_minio] Bucketed into ${clusters.length} moments ` +
      `(30-min gap or 5 photos = split)`,
  );

  // Idempotency probe — fetch all existing photo URLs once so we
  // don't issue N queries per cluster.
  const existingPhotos = await prisma.momentPhoto.findMany({
    select: { url: true },
  });
  const existingPhotoUrls = new Set(existingPhotos.map((p) => p.url));
  console.log(
    `[restore_minio] DB pre-existing: ${existingPhotoUrls.size} photo URLs`,
  );

  let willInsertMoments = 0;
  let willInsertPhotos = 0;
  let skippedClusters = 0;

  for (let i = 0; i < clusters.length; i += 1) {
    const cluster = clusters[i]!;
    const photos = cluster.files;

    // Idempotency: if every URL in this cluster already exists, the
    // cluster has been restored on a prior run — skip the whole
    // moment.
    if (photos.every((p) => existingPhotoUrls.has(p.url))) {
      skippedClusters += 1;
      continue;
    }

    const newPhotos = photos.filter((p) => !existingPhotoUrls.has(p.url));

    // Sequential title — oldest cluster = "Moment 1", newest = "Moment N".
    // Cluster index `i` is already 0-based ascending by upload time
    // because clusters[] preserves the sorted file order.
    const title = `Moment ${i + 1}`;
    const isoDate = new Date(cluster.startMs).toISOString();

    console.log(
      `\n[cluster ${i + 1}/${clusters.length}] ${isoDate} — ${photos.length} photo ` +
        `(new: ${newPhotos.length})`,
    );
    console.log(`  → moment: title="${title}" date=${isoDate} author=Boss`);
    if (newPhotos.length > 0) {
      console.log(
        `    photos: ${newPhotos
          .slice(0, 3)
          .map((p) => p.filename)
          .join(', ')}${newPhotos.length > 3 ? ` (+${newPhotos.length - 3} more)` : ''}`,
      );
    }

    willInsertMoments += 1;
    willInsertPhotos += newPhotos.length;

    if (DRY_RUN) continue;

    // LIVE — single transaction per cluster so a mid-cluster failure
    // doesn't leave a moment row with no photos.
    await prisma.$transaction(async (tx) => {
      const moment = await tx.moment.create({
        data: {
          coupleId: BOSS_COUPLE,
          authorId: BOSS_USER,
          title,
          caption: null,
          date: new Date(cluster.startMs),
          tags: [],
          createdAt: new Date(cluster.startMs),
          updatedAt: new Date(cluster.startMs),
        },
      });
      await tx.momentPhoto.createMany({
        data: newPhotos.map((p) => ({
          momentId: moment.id,
          filename: p.filename,
          url: p.url,
          createdAt: new Date(p.epochMs),
        })),
      });
    });
    // Update local idempotency set so duplicate filenames in the same
    // run don't double-insert.
    for (const p of newPhotos) existingPhotoUrls.add(p.url);
  }

  console.log(
    `\n[restore_minio] ${DRY_RUN ? 'DRY-RUN' : 'LIVE'} summary:`,
  );
  console.log(`  Clusters total:    ${clusters.length}`);
  console.log(`  Clusters skipped:  ${skippedClusters} (already restored)`);
  console.log(`  Moments to insert: ${willInsertMoments}`);
  console.log(`  Photos to insert:  ${willInsertPhotos}`);
  if (DRY_RUN) {
    console.log(
      '\n[restore_minio] DRY-RUN ONLY — no DB writes. Re-run with DRY_RUN=false to execute.',
    );
  } else {
    console.log('\n[restore_minio] LIVE run complete.');
  }
  process.exit(0);
})().catch((e) => {
  console.error('[restore_minio] FATAL:', e);
  process.exit(1);
});
