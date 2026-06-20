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
    subject: "Your 1500 drill login link",
    text:
      `Sign in to your 1500 SAT Blueprint drills:\n\n${url}\n\n` +
      `This link works once and expires in 15 minutes. If you didn't request it, ignore this email.`,
    html: render(url),
  });
  if (error) throw new Error(`failed to send magic link: ${error.message}`);
}

function render(url: string): string {
  return `
  <div style="margin:0;padding:24px;background:#0b2a5b;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 32px;background:#0b2a5b;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">1500 SAT Blueprint</span>
      </div>
      <div style="padding:32px;color:#1a233e;">
        <h1 style="margin:0 0 12px;font-size:20px;">Sign in to your drills</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#41506b;">
          Click the button below to log in. This link works once and expires in 15 minutes.
        </p>
        <a href="${url}" style="display:inline-block;background:#ffbd20;color:#0b2a5b;font-weight:700;font-size:15px;text-decoration:none;padding:12px 24px;border-radius:999px;">
          Log in to 1500 drills
        </a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a93a6;">
          If you didn't request this, you can safely ignore this email. If the button doesn't work, paste this link into your browser:<br />
          <span style="color:#2b8fe0;word-break:break-all;">${url}</span>
        </p>
      </div>
    </div>
  </div>`;
}
