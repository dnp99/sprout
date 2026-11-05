"use client";

import { LoadingStatus } from "@/components/ui/LoadingIndicator";

import { WhatsNewPrompt } from "@/components/settings/WhatsNew";
import { PwaSignInPrompt } from "@/components/settings/PwaSignInPrompt";
import { useSessionResume } from "@/hooks/useSessionResume";
import { EntitySymbol } from "@/components/ui/EntitySymbol";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GroupApp } from "@/components/groups/GroupApp";
import { groupReturnPath, isGroupPath } from "@/lib/groups/navigation";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { MobileApp } from "@/components/mobile/MobileApp";
import { WebApp } from "@/components/web/WebApp";
import { useRouteSync } from "@/components/useRouteSync";
import { SECTION_PATHS } from "@/lib/nav";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/**
 * Root frame. Until the auth/onboarding flow finishes it shows the auth
 * experience (full-screen on phones, split-screen on desktop). Once done, the
 * same data renders as the mobile app below `lg` and the web dashboard at `lg+`.
 *
 * The persistent workspace layout renders this component. It owns the auth boundary — `/login` when
 * signed out, a section route (`/home`, `/transactions`, …) when signed in — and
 * delegates section-to-section navigation to `useRouteSync`, which keeps the URL
 * in step with whichever surface is visible.
 */
export function AppShell() {
  const { flowStep, loaded, loadError, refresh } = useStore(
    useShallow((s) => ({
      flowStep: s.flowStep,
      loaded: s.loaded,
      loadError: s.loadError,
      refresh: s.refresh,
    })),
  );
  const pathname = usePathname();
  const router = useRouter();
  const authed = flowStep === "done";
  const clearGroup = useStore((s) => s.clearGroup);
  const groupRoute = isGroupPath(pathname);
  useSessionResume(groupRoute);
  useRouteSync(authed && !groupRoute);
  useEffect(() => {
    if (!groupRoute) clearGroup();
  }, [groupRoute, clearGroup]);

  useEffect(() => {
    if (flowStep === "booting") return; // auth check still in flight
    if (!authed && pathname !== "/login") {
      if (groupRoute) {
        try {
          const invite = new URLSearchParams(window.location.search).get("invite");
          if (invite) sessionStorage.setItem("sprout-group-invite", invite);
        } catch {
          /* Code can be pasted again if storage is blocked. */
        }
        router.replace(
          `/login?returnTo=${encodeURIComponent(groupReturnPath(pathname) ?? "/groups")}`,
        );
      } else router.replace("/login");
    } else if (authed && !groupRoute && !SECTION_PATHS.includes(pathname)) {
      // Signed in but off a section route (e.g. `/`, `/login`, unknown) — land
      // on the dashboard.
      const target = groupReturnPath(new URLSearchParams(window.location.search).get("returnTo"));
      router.replace(target ?? "/home");
    }
  }, [flowStep, authed, pathname, groupRoute, router]);

  // Initial auth check in flight — auth is still unknown, so show a neutral brand
  // loader rather than the authenticated app skeleton (which would flash the
  // dashboard chrome at signed-out visitors before we bounce them to login).
  if (flowStep === "booting") {
    return <BootLoader />;
  }

  // A redirect to the correct route is pending — bridge with the neutral loader
  // so we don't flash the wrong screen (e.g. the app at /login) for a frame.
  const onRightRoute = authed
    ? groupRoute || SECTION_PATHS.includes(pathname)
    : pathname === "/login";
  if (!onRightRoute) {
    return <BootLoader />;
  }

  if (flowStep !== "done") {
    return <AuthGate />;
  }

  if (groupRoute)
    return (
      <div data-ledger-context="group" className="min-h-[100svh] bg-bg text-ink">
        <GroupApp key={pathname.split("/")[2] ?? "directory"} />
        <PwaSignInPrompt />
        <WhatsNewPrompt />
      </div>
    );

  if (loadError) {
    return <ErrorScreen onRetry={refresh} />;
  }

  return (
    <>
      <div
        data-ledger-context="personal"
        className="flex min-h-[100svh] justify-center bg-bg text-ink lg:hidden"
      >
        <MobileApp loading={!loaded} />
      </div>
      <div className="hidden lg:block">
        <WebApp loading={!loaded} />
      </div>
      <PwaSignInPrompt />
      <WhatsNewPrompt />
    </>
  );
}

/** Neutral, auth-agnostic loader for the phases where we don't yet know (or are
 *  changing) who the visitor is: the initial auth check and a pending route
 *  redirect. A signed-out visitor should never glimpse authenticated dashboard
 *  chrome before landing on login. */
function BootLoader() {
  return <Splash />;
}

/** Full-page loading remains neutral while authentication and data resolve. */
export function Splash() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-bg">
      <LoadingStatus size={48} />
    </div>
  );
}

/** Shown when the user is signed in but their data couldn't be loaded (API/DB
 *  error). Offers a retry rather than rendering an empty or fake dashboard. */
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-8 text-center">
      <div className="text-5xl">
        <EntitySymbol emoji="🌧️" size={40} />
      </div>
      <div className="mt-4 text-2xl font-bold text-ink">Couldn&rsquo;t load your data</div>
      <p className="mt-2 max-w-[340px] text-[14px] font-semibold text-muted">
        Something went wrong reaching Sprout. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-primary px-6 py-3 text-[14px] font-semibold text-onprimary"
      >
        Try again
      </button>
    </div>
  );
}

function AuthGate() {
  return (
    <>
      {/* Mobile: full-screen cream */}
      <div className="flex min-h-[100svh] flex-col bg-bg px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
        <div className="shrink-0 text-2xl font-bold text-primary">
          <EntitySymbol emoji="🌱" /> Sprout
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center py-4">
          <div className="w-full max-w-[440px]">
            <AuthFlow />
          </div>
        </div>
      </div>

      {/* Desktop: split-screen promo + form */}
      <div className="hidden min-h-screen lg:flex">
        <div className="flex flex-[1.05] flex-col justify-center bg-primary px-14 py-14 text-white">
          <div className="text-3xl font-bold">
            <EntitySymbol emoji="🌱" /> Sprout
          </div>
          <div className="mt-7 text-[38px] font-bold leading-[1.15] tracking-tight">
            Money that
            <br />
            grows with you.
          </div>
          <div className="mt-4 max-w-[340px] text-[15px] font-semibold leading-relaxed opacity-90">
            Track spending, set goals, and budget with confidence — with a little joy along the way.
          </div>
          <div className="mt-8 flex gap-6 text-[13px] font-bold opacity-90">
            <span>
              <EntitySymbol emoji="📈" /> Smart insights
            </span>
            <span>
              <EntitySymbol emoji="🎯" /> Personal goals
            </span>
          </div>
        </div>
        {/* Warm brand glow so the form side reads as an atmospheric panel, not a
            flat black void next to the terracotta promo (mostly felt in dark). */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg p-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 55% at 72% 38%, rgba(201,117,83,0.13), transparent 72%)",
          }}
        >
          <div className="relative w-[380px]">
            <AuthFlow />
          </div>
        </div>
      </div>
    </>
  );
}
