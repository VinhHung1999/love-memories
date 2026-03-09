import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CDN_ENDPOINT: z.string().optional(),
  CDN_ACCESS_KEY: z.string().optional(),
  CDN_SECRET_KEY: z.string().optional(),
  CDN_BUCKET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Missing/invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}
