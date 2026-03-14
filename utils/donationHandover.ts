import type { DonationHandoverSummary, FoodItem } from '../types';

/**
 * Builds the plain-text body for the NGO notification email so they receive
 * full donation details: donor contact, items with expiry, date/time, mode, notes.
 */
export function buildHandoverEmailBody(summary: DonationHandoverSummary): string {
  const lines: string[] = [
    'SaveBite – Donation handover details',
    '-----------------------------------',
    '',
    `NGO: ${summary.ngoName}`,
    '',
    'DONOR CONTACT',
    `Name: ${summary.donorName}`,
    `Phone: ${summary.donorPhone}`,
    '',
    'HANDOVER',
    `Date: ${summary.handoverDate}`,
    `Time: ${summary.handoverTime}`,
    `Mode: ${summary.mode === 'dropoff' ? 'Donor will drop off' : 'Donor requests pickup'}`,
    '',
    'ITEMS (safe to consume, with expiry for prioritization)',
    '---',
  ];
  summary.items.forEach((item) => {
    const cond = item.condition ? ` | Condition: ${item.condition}` : '';
    lines.push(`• ${item.name}: ${item.quantity} ${item.unit} | Expires: ${item.expiryDate}${cond}`);
  });
  lines.push('');
  if (summary.notes.trim()) {
    lines.push('NOTES FROM DONOR');
    lines.push(summary.notes.trim());
    lines.push('');
  }
  lines.push('-----------------------------------');
  lines.push('This donation was submitted via SaveBite. Please contact the donor on the phone above for any coordination.');
  return lines.join('\n');
}

/**
 * Builds the email subject line for the NGO notification.
 */
export function buildHandoverEmailSubject(donorName: string, handoverDate: string): string {
  return `SaveBite Donation – ${donorName} – ${handoverDate}`;
}

/**
 * Opens the user's email client with a pre-filled message to the NGO.
 * The donor sends the email so the NGO receives full handover data.
 */
export function openHandoverMailto(
  ngoEmail: string,
  summary: DonationHandoverSummary
): void {
  const subject = buildHandoverEmailSubject(summary.donorName, summary.handoverDate);
  const body = buildHandoverEmailBody(summary);
  const mailto = `mailto:${encodeURIComponent(ngoEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank', 'noopener');
}

/**
 * Builds a handover summary from Donation component state (for use in mailto and copy).
 */
export function buildHandoverSummary(params: {
  ngoName: string;
  donorName: string;
  donorPhone: string;
  handoverDate: string;
  handoverTime: string;
  mode: 'dropoff' | 'pickup';
  items: FoodItem[];
  notes: string;
}): DonationHandoverSummary {
  return {
    ngoName: params.ngoName,
    donorName: params.donorName,
    donorPhone: params.donorPhone,
    handoverDate: params.handoverDate,
    handoverTime: params.handoverTime,
    mode: params.mode,
    notes: params.notes,
    items: params.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      expiryDate: new Date(i.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      condition: i.condition,
    })),
  };
}
