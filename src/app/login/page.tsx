import { AppShell } from "@/components/AppShell";

/** `/login` — the signed-out gate. AppShell renders the auth experience and
 *  bounces to `/home` if the visitor is already signed in. */
export default function LoginPage() {
  return <AppShell />;
}
