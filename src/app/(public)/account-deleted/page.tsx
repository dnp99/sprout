import Link from "next/link";

/** Public confirmation shown after a user deletes their own account (plan 015).
 *  The session is already cleared, so this lives in the (public) group — no auth,
 *  English-only like the rest of the marketing/legal surface. */
export const metadata = { title: "Account deleted · Sprout" };

export default function AccountDeletedPage() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-md rounded-[16px] border border-edge bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-[22px]">
          🌱
        </div>
        <h1 className="mt-5 text-[22px] font-bold tracking-[-0.02em]">Your account was deleted</h1>
        <p className="mt-3 text-[14px] font-medium leading-relaxed text-muted">
          Your Sprout account and its data have been removed from active use. Thanks for giving
          Sprout a try — you’re always welcome back.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-[11px] bg-primary px-5 py-2.5 text-[13px] font-semibold text-onprimary"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
