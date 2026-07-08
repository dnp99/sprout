import { AppShell } from "@/components/AppShell";

/** `/home` — the signed-in app. AppShell renders the dashboard and bounces to
 *  `/login` if the visitor isn't authenticated. */
export default function HomePage() {
  return <AppShell />;
}
