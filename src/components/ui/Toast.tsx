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
  showToast: (message: string, tone?: ToastTone, action?: ToastMessage["action"]) => void;
} | null>(null);

/** App-wide, short-lived feedback that appears only after an API action settles. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("mobile");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setToast(null);
  }, []);
  const showToast = useCallback(
    (message: string, tone: ToastTone = "success", action?: ToastMessage["action"]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ message, tone, action });
      timeoutRef.current = setTimeout(dismiss, 4500);
    },
    [dismiss],
  );
  useEffect(() => dismiss, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role={toast.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-[14px] border-2 bg-card p-4 shadow-2xl sm:top-6 ${
            toast.tone === "success" ? "border-green" : "border-danger"
          }`}
        >
          {toast.tone === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 flex-none text-green" />
          ) : (
            <CircleAlert size={18} className="mt-0.5 flex-none text-primary" />
          )}
          <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-ink">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismiss();
              }}
              className="h-8 rounded-[8px] px-2 text-[12px] font-semibold text-primary hover:bg-primary-soft"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("dismiss")}
            className="-mr-1 -mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-[8px] text-muted hover:bg-track hover:text-ink"
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
