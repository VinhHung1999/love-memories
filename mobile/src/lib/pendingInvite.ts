/**
 * In-memory store for a pending invite code captured from a deep-link
 * before the user is authenticated.
 *
 * Flow:
 *  1. User taps invite link → navigation/index.tsx captures code here
 *  2. User registers or logs in
 *  3. OnboardingWelcome / useLoginViewModel reads the code and auto-joins
 *  4. clearPendingInviteCode() called on success or failure
 */

let _pendingCode: string | null = null;

export const setPendingInviteCode = (code: string): void => {
  _pendingCode = code;
};

export const getPendingInviteCode = (): string | null => _pendingCode;

export const clearPendingInviteCode = (): void => {
  _pendingCode = null;
};
