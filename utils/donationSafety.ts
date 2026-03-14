import type { FoodItem } from '../types';

/**
 * Conditions that make food unsafe to donate (spoiled, contaminated, or past safe use).
 * Items with these conditions are excluded from the donation flow.
 */
export const UNSAFE_CONDITIONS_FOR_DONATION = [
  'expired',
  'spoiled',
  'moldy',
  'bad',
  'contaminated',
  'damaged',
  'rotten',
  'off',
  'unsafe',
] as const;

/** Minimum days until expiry for an item to be eligible for donation (0 = up to expiry date). */
export const MIN_DAYS_UNTIL_EXPIRY = 0;

/**
 * Returns true if the item is safe and eligible to be donated to an NGO.
 * - Must be active (not already donated/wasted/consumed).
 * - Must not be past expiry date.
 * - Must not have an unsafe condition (spoiled, moldy, etc.).
 */
export function isEligibleForDonation(item: FoodItem): boolean {
  if (item.status !== 'active') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
  if (daysUntilExpiry < MIN_DAYS_UNTIL_EXPIRY) return false;

  const condition = (item.condition || '').toLowerCase().trim();
  const isUnsafeCondition = UNSAFE_CONDITIONS_FOR_DONATION.some(
    (unsafe) => condition.includes(unsafe)
  );
  if (isUnsafeCondition) return false;

  return true;
}

/**
 * Returns a short reason why the item is not eligible, for UI messages.
 */
export function getIneligibilityReason(item: FoodItem): string | null {
  if (item.status !== 'active') return 'Item is no longer available.';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  if (expiry < today) return 'Expired food cannot be donated.';
  const condition = (item.condition || '').toLowerCase().trim();
  const isUnsafe = UNSAFE_CONDITIONS_FOR_DONATION.some((u) => condition.includes(u));
  if (isUnsafe) return 'Unsafe or spoiled food cannot be donated.';
  return null;
}
