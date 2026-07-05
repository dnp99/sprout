"use client";

import { AuthFlow } from "@/components/auth/AuthFlow";
import { MobileApp } from "@/components/mobile/MobileApp";
import { WebApp } from "@/components/web/WebApp";
import { useStore } from "@/state/store";

/**
 * Root frame. Until the auth/onboarding flow finishes it shows the auth
 * experience (full-screen on phones, split-screen on desktop). Once done, the
 * same data renders as the mobile app below `lg` and the web dashboard at `lg+`.
 */
export function AppShell() {
  const { flowStep, loaded } = useStore();

  if (flowStep !== "done") {
    return <AuthGate />;
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="animate-pulse text-3xl font-extrabold text-primary">🌱 Sprout</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen justify-center bg-bg lg:hidden">
        <MobileApp />
      </div>
      <div className="hidden lg:block">
        <WebApp />
      </div>
    </>
  );
}

function AuthGate() {
  return (
    <>
      {/* Mobile: full-screen cream */}
      <div className="flex min-h-screen flex-col bg-bg px-7 py-14 lg:hidden">
        <div className="text-2xl font-extrabold text-primary">🌱 Sprout</div>
        <div className="mt-4 flex flex-1 flex-col">
          <AuthFlow />
        </div>
      </div>

      {/* Desktop: split-screen promo + form */}
      <div className="hidden min-h-screen lg:flex">
        <div className="flex flex-[1.05] flex-col justify-center bg-primary px-14 py-14 text-white">
          <div className="text-3xl font-extrabold">🌱 Sprout</div>
          <div className="mt-7 text-[38px] font-extrabold leading-[1.15] tracking-tight">
            Money that
            <br />
            grows with you.
          </div>
          <div className="mt-4 max-w-[340px] text-[15px] font-semibold leading-relaxed opacity-90">
            Track spending, set goals, and budget with confidence — with a little joy along the way.
          </div>
          <div className="mt-8 flex gap-6 text-[13px] font-bold opacity-90">
            <span>📈 Smart insights</span>
            <span>🎯 Personal goals</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-bg p-10">
          <div className="w-[380px]">
            <AuthFlow />
          </div>
        </div>
      </div>
    </>
  );
}
