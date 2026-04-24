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
