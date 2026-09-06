interface PasswordResetEmail {
  to: string;
  resetUrl: string;
  expiresAt: Date;
}

/**
 * Small provider boundary for recovery email. Keeping Resend's HTTP API here
 * makes routes testable and avoids loading an email SDK into the application.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresAt,
}: PasswordResetEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Password reset email is not configured.");
    }
    console.info("Password reset email skipped outside production.", {
      to,
      expiresAt: expiresAt.toISOString(),
    });
    return;
  }

  const expires = expiresAt.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  const text = `Reset your Sprout password by opening this link within 30 minutes:\n${resetUrl}\n\nThis link expires at ${expires}. If you did not request it, you can safely ignore this email.`;
  const html = `<p>Reset your Sprout password by opening the link below within 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires at ${expires}. If you did not request it, you can safely ignore this email.</p>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Reset your Sprout password", text, html }),
  });
  if (!response.ok) throw new Error(`Password reset email provider returned ${response.status}.`);
}

export function passwordResetUrl(token: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) throw new Error("NEXT_PUBLIC_APP_URL is required for password reset links.");
  const url = new URL("/reset-password", origin);
  url.searchParams.set("token", token);
  return url.toString();
}
