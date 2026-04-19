import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

// T289/T309 (Sprint 60 polish) — public landing for `https://memoura.app/join/:code`.
// Two audiences:
//   1. App-not-installed users (primary flow until AASA ships in Sprint 65):
//      show the code pill, lead with the download CTA, then a secondary
//      "Đã có app" deep-link for anyone who installed between share and tap.
//   2. App-installed users on iOS — Universal Link should open the app
//      directly without ever rendering this page (handled by AASA when it
//      ships). If iOS still routes here (race, AASA cache, in-app browser),
//      the "Đã có app" button is the manual fallback.
//
// App Store ID is a placeholder until Memoura ships publicly — the app is
// currently distributed via app-store.hungphu.work (ad-hoc). Update both
// `APP_STORE_ID` and `APP_STORE_URL` once the public ASC listing is live.
const APP_STORE_ID = '0000000000';
const APP_STORE_URL = 'https://app-store.hungphu.work';
const SCHEME_DEEP_LINK = (code: string) => `memoura://join/${code.toLowerCase()}`;
const UNIVERSAL_LINK = (code: string) => `https://memoura.app/join/${code.toLowerCase()}`;

function formatHexCode(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 8) return upper;
  return `${upper.slice(0, 4)} ${upper.slice(4)}`;
}

// Strip non-hex, uppercase, cap at 8 — handles share-link-borne junk.
function sanitizeHex(raw: string | undefined): string {
  if (!raw) return '';
  const out: string[] = [];
  for (const ch of raw) {
    if (/[0-9a-f]/i.test(ch)) out.push(ch);
    if (out.length >= 8) break;
  }
  return out.join('').toUpperCase();
}

export default function JoinLandingPage() {
  const params = useParams<{ code: string }>();
  const code = useMemo(() => sanitizeHex(params.code), [params.code]);
  const formatted = code ? formatHexCode(code) : '';
  const [copied, setCopied] = useState(false);

  // Smart App Banner — iOS Safari renders this as a top banner with an OPEN
  // button if the app is installed, falling back to the App Store. Injected
  // dynamically so the banner is only set on this route, not site-wide.
  useEffect(() => {
    if (!code) return;
    const meta = document.createElement('meta');
    meta.name = 'apple-itunes-app';
    meta.content = `app-id=${APP_STORE_ID}, app-argument=${UNIVERSAL_LINK(code)}`;
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = `Memoura · Mã ${code}`;
    return () => {
      meta.remove();
      document.title = prevTitle;
    };
  }, [code]);

  const onCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can throw on insecure origins / old Safari — silent fail
      // is fine, the code is still on screen and selectable.
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
        <div>
          <h1 className="font-heading text-2xl text-gray-900">Mã không hợp lệ</h1>
          <p className="mt-2 text-sm text-gray-600">
            Liên kết em nhận được không có mã. Em hỏi lại người ấy nhé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">
      <div className="mx-auto max-w-md px-6 pt-16 pb-12 text-center">
        <PairedHearts />

        <p className="mt-8 font-body text-xs uppercase tracking-[3px] text-rose-500">
          Người ấy mời em
        </p>
        <h1 className="mt-3 font-heading text-3xl leading-tight text-gray-900">
          Vào Memoura cùng nhau
        </h1>
        <p className="mt-3 font-body text-sm text-gray-600">
          Memoura là nơi hai đứa giữ lại khoảnh khắc, thư tay và những câu hỏi nhỏ của mỗi ngày.
        </p>

        {/* T309: code pill — ring + pill shape reads as a shareable token, not
            a generic card. Tap-to-copy kept with animated "Đã chép" affordance. */}
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Chạm để chép mã ${code}`}
          className="mt-10 w-full rounded-full border border-rose-200 bg-white px-6 py-5 shadow-[0_8px_24px_-8px_rgba(232,120,138,0.4)] transition active:opacity-80"
        >
          <p className="font-body text-[10px] uppercase tracking-[3px] text-rose-500">
            mã ghép đôi
          </p>
          <p className="mt-1.5 font-heading text-4xl tracking-[4px] text-gray-900">
            {formatted}
          </p>
          <p className="mt-1.5 font-body text-[11px] text-gray-500">
            {copied ? 'Đã chép mã ✓' : 'Chạm để chép mã'}
          </p>
        </button>

        {/* T309: primary CTA = download. Until AASA ships (Sprint 65), most
            taps on this page are "app not installed" — lead with install. */}
        <a
          href={APP_STORE_URL}
          className="mt-8 block w-full rounded-full bg-rose-500 px-6 py-4 font-body text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition active:opacity-80"
        >
          Tải Memoura
        </a>

        {/* T309: secondary CTA = "Đã có app" deep-link. Label matters —
            "Mở Memoura" read as generic; "Đã có app" names the user state. */}
        <a
          href={SCHEME_DEEP_LINK(code)}
          className="mt-3 block w-full rounded-full border border-gray-300 bg-white px-6 py-4 font-body text-sm font-semibold text-gray-900 transition active:opacity-80"
        >
          Đã có app · Mở Memoura
        </a>

        <button
          type="button"
          disabled
          className="mt-3 block w-full rounded-full border border-gray-200 bg-white/50 px-6 py-4 font-body text-sm font-medium text-gray-400"
        >
          Google Play · sắp ra mắt
        </button>

        <p className="mt-10 font-body text-xs leading-relaxed text-gray-500">
          Đã cài Memoura nhưng nút không mở?
          <br />
          Mở app, chọn <span className="font-semibold text-gray-700">"Có mã rồi"</span> và nhập{' '}
          <span className="font-mono tracking-wider text-gray-700">{code}</span>.
        </p>
      </div>
    </div>
  );
}

function PairedHearts() {
  return (
    <div className="mx-auto h-[120px] w-[180px] relative">
      <div className="absolute left-2 top-3 flex h-20 w-20 items-center justify-center rounded-full bg-rose-400 shadow-lg ring-4 ring-white">
        <span className="font-heading text-3xl text-white">L</span>
      </div>
      <div className="absolute right-2 top-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-400 shadow-lg ring-4 ring-white">
        <span className="font-heading text-3xl text-white">?</span>
      </div>
      <span className="absolute left-1/2 top-12 -translate-x-1/2 text-2xl">💞</span>
    </div>
  );
}
