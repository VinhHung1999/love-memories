import multer from 'multer';

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // D38 (Sprint 64 Build 75): accept HEIC/HEIF from iOS cameras. The default
  // iPhone format for new photos is HEIC; photos picked via expo-image-picker
  // arrive here with mimetype `image/heic` (sometimes `image/heif`). The old
  // whitelist rejected them as "Only image files are allowed" and the mobile
  // upload silently retried forever in the upload queue.
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const audioFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // D53 (Sprint 65 Build 81 hot-fix): log every incoming audio multipart so
  // we can see exactly what mimetype the mobile FormData layer landed on.
  // Build 81 audio uploads still rejected with "Only audio files are
  // allowed" — D52 file-copy-to-.m4a didn't help, so iOS RN must be
  // inferring the mimetype from file magic bytes, not the URI extension.
  // This log + a Boss retest exposes the actual rejected mimetype so we can
  // either expand the whitelist (add audio/x-caf etc.) or chase a true
  // mobile-side container fix. Remove once the audio path is stable.
  console.log('[audio-upload]', {
    mimetype: file.mimetype,
    originalname: file.originalname,
    fieldname: file.fieldname,
    encoding: file.encoding,
  });
  const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'));
  }
};

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  fileFilter: audioFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
