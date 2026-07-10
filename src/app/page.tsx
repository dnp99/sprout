import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/Landing";
import { getSessionUser } from "@/lib/auth/currentUser";

export const metadata: Metadata = {
  title: "Sprout — Money that grows with you",
  description:
    "A friendly personal budgeting app. Track spending, set goals, import your bank statement, and log expenses by voice or text with Siri and WhatsApp.",
};

/** `/` — public marketing landing for signed-out visitors. Signed-in users are
 *  forwarded straight to their dashboard (server-side, so there's no flash of
 *  the landing page before the redirect). */
export default async function Page() {
  const user = await getSessionUser();
  if (user) redirect("/home");
  return <Landing />;
}
