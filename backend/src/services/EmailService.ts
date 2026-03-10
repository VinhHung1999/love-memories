import nodemailer from 'nodemailer';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../types/errors';

const VERIFICATION_EXPIRY_HOURS = 24;
const RATE_LIMIT_PER_HOUR = 3;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: false,
    auth: { user, pass },
  });
}

function buildVerificationEmail(name: string, verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Verify your Love Memories email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #E8788A;">Love Memories 💕</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email address to complete your account setup.</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          background: #E8788A;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Verify Email</a>
        <p style="color: #888; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  };
}

export async function sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
  // Rate limit: max 3 emails per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.emailVerification.count({
    where: { userId, createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    throw new AppError(429, 'Too many verification emails. Please wait before requesting another.');
  }

  // Invalidate previous unverified tokens for this user
  await prisma.emailVerification.deleteMany({
    where: { userId, verifiedAt: null },
  });

  // Create new token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.emailVerification.create({
    data: { userId, token, expiresAt },
  });

  // Send email (best-effort — skip if SMTP not configured)
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EmailVerification] SMTP not configured. Token for ${email}: ${token}`);
    return;
  }

  const appUrl = process.env.APP_URL || 'https://love-scrum.hungphu.work';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const { subject, html } = buildVerificationEmail(name, verifyUrl);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    html,
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const record = await prisma.emailVerification.findUnique({ where: { token } });

  if (!record) throw new AppError(400, 'Invalid or expired verification token');
  if (record.verifiedAt) throw new AppError(400, 'Email already verified');
  if (record.expiresAt < new Date()) throw new AppError(400, 'Verification token has expired');

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
  ]);
}
