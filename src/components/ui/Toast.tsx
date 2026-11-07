"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type ToastTone = "success" | "error";
type ToastMessage = {
  message: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
};

const ToastContext = createContext<{
  showToast: (
    message: string,
    tone?: ToastTone,
    action?: ToastMessage["action"],
    durationMs?: number,
  ) => void;
} | null>(null);

/** App-wide feedback that appears only after an API action settles. Individual
 * outcomes can request more time when the user needs to absorb a summary. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("mobile");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = useRef(0);
  const started = useRef(0);
  const hovered = useRef(false);
  const focused = useRef(false);
  const current = useRef<ToastMessage | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    hovered.current = false;
    focused.current = false;
    current.current = null;
    setToast(null);
  }, []);
  const resume = useCallback(() => {
    if (hovered.current || focused.current || !current.current || timeoutRef.current) return;
    started.current = Date.now();
    timeoutRef.current = setTimeout(dismiss, remaining.current);
  }, [dismiss]);
  const pause = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    remaining.current = Math.max(0, remaining.current - (Date.now() - started.current));
  }, []);
  const showToast = useCallback(
    (
      message: string,
      tone: ToastTone = "success",
      action?: ToastMessage["action"],
      durationMs?: number,
    ) => {
      // Repeated feedback must not restart announcements or keep the same toast alive forever.
      const previous = current.current;
      if (
        previous?.message === message &&
        previous.tone === tone &&
        previous.action?.onClick === action?.onClick &&
        previous.action?.label === action?.label
      )
        return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      current.current = { message, tone, action };
      remaining.current = durationMs ?? (tone === "error" || action ? 8000 : 3500);
      setToast(current.current);
      resume();
    },
    [resume],
  );
  useEffect(() => dismiss, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role={toast.tone === "error" ? "alert" : "status"}
          aria-live={toast.tone === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          onMouseEnter={() => {
            hovered.current = true;
            pause();
          }}
          onMouseLeave={() => {
            hovered.current = false;
            resume();
          }}
          onFocusCapture={() => {
            focused.current = true;
            pause();
          }}
          onBlurCapture={(event) => {
            if (event.currentTarget.contains(event.relatedTarget)) return;
            focused.current = false;
            resume();
          }}
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-[100] flex w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 items-center gap-2 rounded-[14px] border border-edge bg-card py-2 pl-3 pr-1 shadow-lg lg:top-6"
        >
          {toast.tone === "success" ? (
            <CheckCircle2 size={18} className="flex-none text-green" />
          ) : (
            <CircleAlert size={18} className="flex-none text-danger" />
          )}
          <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-ink">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismiss();
              }}
              className="min-h-11 rounded-[8px] px-2 text-[12px] font-semibold text-primary hover:bg-primary-soft"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("dismiss")}
            className="flex h-11 w-11 flex-none items-center justify-center rounded-[8px] text-muted hover:bg-track hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}
