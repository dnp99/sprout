"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Splash } from "@/components/AppShell";
import { useStore } from "@/state/store";

/** `/logout` — clears the session (server cookie + client store) then bounces to
 *  `/login`. A real route so signing out is linkable and refresh-safe. */
export default function LogoutPage() {
  const { logout } = useStore();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(logout()).finally(() => {
      if (!cancelled) router.replace("/login");
    });
    return () => {
      cancelled = true;
    };
  }, [logout, router]);

  return <Splash />;
}
