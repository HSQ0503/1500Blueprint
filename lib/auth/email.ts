import { Resend } from "resend";

// Lazily created so an empty key never throws at import/build time.
let client: Resend | null = null;
function resend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    client = new Resend(key);
  }
  return client;
}

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const { error } = await resend().emails.send({
    from: `1500 SAT Blueprint <${FROM}>`,
    to: email,
    subject: "Your 1500 SAT Blueprint login link",
    text:
      `Sign in to 1500 SAT Blueprint:\n\n${url}\n\n` +
      `This link works once and expires in 15 minutes. If you didn't request it, you can ignore this email.`,
    html: render(url),
  });
  if (error) throw new Error(`failed to send magic link: ${error.message}`);
}

function render(url: string): string {
  return `
  <div style="margin:0;padding:24px 16px;background:#eef2f7;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(11,42,91,0.10);box-shadow:0 12px 40px rgba(7,25,59,0.12);">
      <div style="padding:28px 32px;background:#0b2a5b;background-image:linear-gradient(110deg,rgba(124,203,255,0.20) 0%,transparent 46%),linear-gradient(130deg,#07193b 0%,#0b2a5b 55%,#1b46a8 100%);">
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;line-height:1;">
          <span style="color:#ffffff;">1500</span>
          <span style="color:#7ccbff;">SAT</span>
          <span style="color:#ffffff;">Blueprint</span>
        </div>
        <div style="margin-top:7px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#7ccbff;">Aim for 1500</div>
      </div>

      <div style="padding:32px;color:#1a233e;">
        <h1 style="margin:0 0 10px;font-size:21px;font-weight:800;letter-spacing:-0.01em;color:#0b2a5b;">Sign in to your account</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#41506b;">
          Tap the button below to log in. This link works once and expires in 15 minutes.
        </p>
        <a href="${url}" style="display:inline-block;background:#3fa9f5;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:11px;box-shadow:0 2px 0 #2b8fe0;">
          Log in to 1500 SAT Blueprint
        </a>
        <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#8a93a6;">
          If you didn't request this, you can safely ignore this email. If the button doesn't work, paste this link into your browser:
        </p>
        <p style="margin:8px 0 0;font-size:13px;line-height:1.5;">
          <a href="${url}" style="color:#2b8fe0;word-break:break-all;text-decoration:none;">${url}</a>
        </p>
      </div>

      <div style="padding:16px 32px;border-top:1px solid rgba(11,42,91,0.08);background:#f8fafc;">
        <p style="margin:0;font-size:12px;color:#8a93a6;">1500 SAT Blueprint · Not affiliated with the College Board.</p>
      </div>
    </div>
  </div>`;
}
