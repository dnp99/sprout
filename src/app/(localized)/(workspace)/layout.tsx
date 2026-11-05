import { AppShell } from "@/components/AppShell";

/** One app instance survives section routes on both responsive surfaces. Auth
 * routes remain outside this group and retain their separate entry boundary. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell />
      {children}
    </>
  );
}
