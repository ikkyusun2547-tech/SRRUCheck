import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "SRRU Check <onboarding@resend.dev>";

/** No-op (logs only) when RESEND_API_KEY isn't set, so the app works out of
 * the box in dev without a real email provider — plug in a key whenever. */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!resend) {
    console.log(`[email:noop] to=${to} subject=${subject}`);
    return true;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, text: body });
    if (error) {
      console.error("resend send error", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("resend send exception", err);
    return false;
  }
}
