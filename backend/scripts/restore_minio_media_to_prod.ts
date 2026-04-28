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
// Boss couple's moments + letters + photos. CDN files on the local
// MinIO bucket survived because we only deleted DB rows, not the
// underlying objects. This script reads every file in
// `/Volumes/HungHDD/minio-data/love-scrum/{images,audio,others}/`,
// reconstructs the CDN URL each row pointed at, clusters files into
// per-day moments, and inserts moment + moment_photo + moment_audio
// rows pointing back at those URLs.
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
//     '_dev'. Refuses to run against dev/test DBs (inverse of the usual
//     seed guard — recovery only makes sense on the prod DB whose data
//     was wiped).
//   • Idempotent: each cluster is skipped if any of its photo URLs
//     already exists in `moment_photos`. Re-running after a partial
//     execution is safe.
//   • Audio rows likewise skipped per-URL.
//   • DRY_RUN default = true → script prints the plan + exits 0 without
//     touching the DB. Operator must explicitly set DRY_RUN=false to
//     execute.

// ── Hard env guards (belt + suspenders) ─────────────────────────────
// Three independent checks must all pass:
//   1. URL must contain 'love_scrum' (prod DB name)
//   2. URL must NOT contain '_dev' (rules out love_scrum_dev)
//   3. URL must mention port 5433 (rules out a hypothetical
//      love_scrum_staging on the dev port 5432)
// All three must pass — recall agent recommendation, mirrors the
// triple-check pattern PO uses for `pm2 restart --update-env`.
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

// ── Constants ───────────────────────────────────────────────────────
const MINIO_ROOT = '/Volumes/HungHDD/minio-data/love-scrum';
const CDN_BASE = 'https://cdn-service.hungphu.work/f/love-scrum';
const CLUSTER_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h cluster

const BOSS_COUPLE = 'c7499c7a-4861-4ccd-b4a7-8187bd5bf0ae';
const BOSS_USER = 'e5d1316c-2712-4b64-874f-a6fb67c04c56'; // Huhuhihi / phuvinhhung1999
const PARTNER_USER = '204fda0a-6fd0-4406-94d0-6f11d7029fcb'; // bubumeomeo / khnhu26

const SUBDIRS = ['images', 'audio', 'others'] as const;

// Extension classification — `others/` contains a mix of image + video
// + audio that we route to the right table.
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);
const AUDIO_EXT = new Set(['mp4', 'webm', 'm4a', 'wav', 'mp3', 'caf', 'm4b', 'ogg']);

type ParsedFile = {
  epochMs: number;
  originalName: string;
  ext: string;
  filename: string;
  subdir: (typeof SUBDIRS)[number];
  kind: 'image' | 'audio' | 'unknown';
  url: string;
};

function classify(ext: string): 'image' | 'audio' | 'unknown' {
  const e = ext.toLowerCase();
  if (IMAGE_EXT.has(e)) return 'image';
  if (AUDIO_EXT.has(e)) return 'audio';
  return 'unknown';
}

function parseFilename(filename: string, subdir: (typeof SUBDIRS)[number]): ParsedFile | null {
  // Format: <epochMs>-<originalName>.<ext>
  const m = /^(\d{10,16})-(.+)\.([A-Za-z0-9]+)$/.exec(filename);
  if (!m) return null;
  const epochMs = Number(m[1]);
  const originalName = m[2]!;
  const ext = m[3]!;
  if (!Number.isFinite(epochMs)) return null;
  return {
    epochMs,
    originalName,
    ext,
    filename,
    subdir,
    kind: classify(ext),
    url: `${CDN_BASE}/${subdir}/${filename}`,
  };
}

function listFiles(): ParsedFile[] {
  const out: ParsedFile[] = [];
  for (const subdir of SUBDIRS) {
    const dir = path.join(MINIO_ROOT, subdir);
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const f of entries) {
      if (f.startsWith('.')) continue;
      // MinIO stores each object as a directory whose NAME is the
      // user-facing filename and whose contents are `xl.meta` (+
      // erasure-coded data). The CDN serves these by name, so we
      // treat every named entry as a "file" regardless of whether
      // it's a regular file or a MinIO object-dir. Skip nothing on
      // stat — only the filename pattern decides if we keep it.
      const parsed = parseFilename(f, subdir);
      if (parsed) out.push(parsed);
    }
  }
  return out;
}

type Cluster = {
  startMs: number;
  endMs: number;
  files: ParsedFile[];
};

function clusterFiles(files: ParsedFile[]): Cluster[] {
  // Sort ascending by epoch.
  const sorted = [...files].sort((a, b) => a.epochMs - b.epochMs);
  const clusters: Cluster[] = [];
  for (const f of sorted) {
    const last = clusters[clusters.length - 1];
    if (!last || f.epochMs - last.startMs > CLUSTER_WINDOW_MS) {
      clusters.push({ startMs: f.epochMs, endMs: f.epochMs, files: [f] });
    } else {
      last.endMs = f.epochMs;
      last.files.push(f);
    }
  }
  return clusters;
}

function vnDateLabel(epochMs: number): string {
  // DD/MM/YYYY in VN tz (UTC+7). Avoid Intl heavyweight; do it
  // manually so the script has zero external deps.
  const vn = new Date(epochMs + 7 * 60 * 60 * 1000);
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = vn.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

(async () => {
  const all = listFiles();
  const usable = all.filter((f) => f.kind !== 'unknown');
  const skipped = all.filter((f) => f.kind === 'unknown');

  console.log(
    `[restore_minio] Found ${all.length} files in ${MINIO_ROOT} ` +
      `(${usable.length} usable, ${skipped.length} skipped unknown ext)`,
  );
  if (skipped.length > 0) {
    console.log(`  Skipped exts: ${[...new Set(skipped.map((f) => f.ext))].join(', ')}`);
  }

  const clusters = clusterFiles(usable);
  console.log(
    `[restore_minio] Bucketed into ${clusters.length} day-clusters (24h window each)`,
  );

  // Idempotency probe — fetch all existing photo + audio URLs once so we
  // don't issue N queries per cluster.
  const [existingPhotos, existingAudios] = await Promise.all([
    prisma.momentPhoto.findMany({ select: { url: true } }),
    prisma.momentAudio.findMany({ select: { url: true } }),
  ]);
  const existingPhotoUrls = new Set(existingPhotos.map((p) => p.url));
  const existingAudioUrls = new Set(existingAudios.map((a) => a.url));
  console.log(
    `[restore_minio] DB pre-existing: ${existingPhotoUrls.size} photo URLs, ` +
      `${existingAudioUrls.size} audio URLs`,
  );

  let willInsertMoments = 0;
  let willInsertPhotos = 0;
  let willInsertAudios = 0;
  let skippedClusters = 0;

  for (let i = 0; i < clusters.length; i += 1) {
    const cluster = clusters[i]!;
    const dateLabel = vnDateLabel(cluster.startMs);
    const photos = cluster.files.filter((f) => f.kind === 'image');
    const audios = cluster.files.filter((f) => f.kind === 'audio');

    // Idempotency: if every URL in this cluster already exists, the
    // cluster has been restored on a prior run — skip.
    const allPhotosExist =
      photos.length > 0 && photos.every((p) => existingPhotoUrls.has(p.url));
    const allAudiosExist =
      audios.length > 0 && audios.every((a) => existingAudioUrls.has(a.url));
    const everythingPresent =
      (photos.length === 0 || allPhotosExist) &&
      (audios.length === 0 || allAudiosExist);
    if (everythingPresent) {
      skippedClusters += 1;
      continue;
    }

    const newPhotos = photos.filter((p) => !existingPhotoUrls.has(p.url));
    const newAudios = audios.filter((a) => !existingAudioUrls.has(a.url));

    // Author alternation: even cluster index → Boss, odd → Partner.
    const authorId = i % 2 === 0 ? BOSS_USER : PARTNER_USER;
    const title = `Khoảnh khắc ${dateLabel}`;
    const isoDate = new Date(cluster.startMs).toISOString();

    console.log(
      `\n[cluster ${i + 1}/${clusters.length}] ${dateLabel} — ` +
        `${photos.length} photo / ${audios.length} audio ` +
        `(new: ${newPhotos.length}p / ${newAudios.length}a)`,
    );
    console.log(
      `  → moment: title="${title}" date=${isoDate} author=${
        authorId === BOSS_USER ? 'Boss' : 'Partner'
      }`,
    );
    if (newPhotos.length > 0) {
      console.log(
        `    photos: ${newPhotos
          .slice(0, 3)
          .map((p) => p.filename)
          .join(', ')}${newPhotos.length > 3 ? ` (+${newPhotos.length - 3} more)` : ''}`,
      );
    }
    if (newAudios.length > 0) {
      console.log(
        `    audios: ${newAudios.map((a) => a.filename).join(', ')}`,
      );
    }

    willInsertMoments += 1;
    willInsertPhotos += newPhotos.length;
    willInsertAudios += newAudios.length;

    if (DRY_RUN) continue;

    // LIVE — single transaction per cluster so a mid-cluster failure
    // doesn't leave a moment row with no media.
    await prisma.$transaction(async (tx) => {
      const moment = await tx.moment.create({
        data: {
          coupleId: BOSS_COUPLE,
          authorId,
          title,
          caption: null,
          date: new Date(cluster.startMs),
          tags: [],
          createdAt: new Date(cluster.startMs),
          updatedAt: new Date(cluster.startMs),
        },
      });
      if (newPhotos.length > 0) {
        await tx.momentPhoto.createMany({
          data: newPhotos.map((p) => ({
            momentId: moment.id,
            filename: p.filename,
            url: p.url,
            createdAt: new Date(p.epochMs),
          })),
        });
      }
      if (newAudios.length > 0) {
        await tx.momentAudio.createMany({
          data: newAudios.map((a) => ({
            momentId: moment.id,
            filename: a.filename,
            url: a.url,
            duration: null,
            createdAt: new Date(a.epochMs),
          })),
        });
      }
    });
    // Update local idempotency sets so the same script run can't
    // accidentally double-insert if the bucket has duplicate filenames.
    for (const p of newPhotos) existingPhotoUrls.add(p.url);
    for (const a of newAudios) existingAudioUrls.add(a.url);
  }

  console.log(
    `\n[restore_minio] ${DRY_RUN ? 'DRY-RUN' : 'LIVE'} summary:`,
  );
  console.log(`  Clusters total:   ${clusters.length}`);
  console.log(`  Clusters skipped: ${skippedClusters} (already restored)`);
  console.log(`  Moments to insert: ${willInsertMoments}`);
  console.log(`  Photos to insert:  ${willInsertPhotos}`);
  console.log(`  Audios to insert:  ${willInsertAudios}`);
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
