/**
 * purchasesService.ts
 *
 * Thin wrapper around react-native-purchases (RevenueCat SDK).
 *
 * Product identifiers — Boss configures these in the RevenueCat dashboard:
 *   monthly_3_99   — $3.99 / 49K VND monthly
 *   annual_29_99   — $29.99 / 399K VND annual
 *   lifetime_79_99 — $79.99 / 999K VND lifetime
 *
 * Entitlement: 'plus'
 */

import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_API_KEY } from '../config/tokens';

// ── Product identifiers ────────────────────────────────────────────────────────

export const PRODUCT_IDS = {
  monthly: 'monthly_3_99',
  annual: 'annual_29_99',
  lifetime: 'lifetime_79_99',
} as const;

export const ENTITLEMENT_PLUS = 'plus';

// ── Init ───────────────────────────────────────────────────────────────────────

export function initPurchases(): void {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}

// ── Identify user ──────────────────────────────────────────────────────────────

/**
 * Link RevenueCat anonymous user to our user ID so purchases survive
 * reinstalls and device changes.
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.warn('[RevenueCat] identifyUser failed:', err);
  }
}

export async function resetUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[RevenueCat] resetUser failed:', err);
  }
}

// ── Offerings ──────────────────────────────────────────────────────────────────

/**
 * Fetch available offerings from RevenueCat.
 * Returns null if no offerings configured yet (dashboard not set up).
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (err) {
    console.warn('[RevenueCat] getOfferings failed:', err);
    return null;
  }
}

// ── Purchase ───────────────────────────────────────────────────────────────────

/**
 * Purchase a package from RevenueCat.
 * Returns updated CustomerInfo on success, null if user cancelled.
 * Throws on error (network issues, payment declined, etc.)
 */
export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (err: any) {
    // User cancelled — not an error
    if (err?.userCancelled) return null;
    throw err;
  }
}

// ── Restore ────────────────────────────────────────────────────────────────────

/**
 * Restore purchases from App Store / Play Store.
 * Returns CustomerInfo with updated entitlements.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

// ── Check entitlement ──────────────────────────────────────────────────────────

/**
 * Check if 'plus' entitlement is active from RevenueCat directly.
 * Primary source of truth: our backend /api/subscription/status.
 * This is a secondary check for offline scenarios.
 */
export async function checkPlusEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_PLUS];
  } catch {
    return false;
  }
}
