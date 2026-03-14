import emailjs from '@emailjs/browser';
import type { DonationHandoverSummary } from '../types';
import { buildHandoverEmailBody, buildHandoverEmailSubject } from '../utils/donationHandover';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export function isEmailConfigured(): boolean {
  return !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

/**
 * Sends the handover notification email to the NGO via EmailJS.
 * The NGO receives the email with full donation details.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendHandoverEmailToNgo(
  ngoEmail: string,
  summary: DonationHandoverSummary
): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: 'Email not configured' };
  }
  try {
    await emailjs.init(PUBLIC_KEY!);
    const subject = buildHandoverEmailSubject(summary.donorName, summary.handoverDate);
    const message = buildHandoverEmailBody(summary);
    await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, {
      to_email: ngoEmail,
      subject,
      message,
      ngo_name: summary.ngoName,
      donor_name: summary.donorName,
      donor_phone: summary.donorPhone,
      handover_date: summary.handoverDate,
      handover_time: summary.handoverTime,
      handover_mode: summary.mode === 'dropoff' ? 'Donor will drop off' : 'Donor requests pickup',
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('EmailJS send failed', err);
    return { ok: false, error: message };
  }
}
