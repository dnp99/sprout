"use client";
import { useState, type ReactNode } from "react";
import { Calculator, Delete } from "lucide-react";
import { useTranslations } from "next-intl";
import { calculateCents, calculatorInput } from "@/lib/calculator";

/** An explicit Apply keeps an unfinished expression out of the saved draft. */
export function AmountCalculator({
  cents = 0,
  onApply,
  children,
}: {
  children?: ReactNode;
  cents?: number;
  onApply: (cents: number) => void;
}) {
  const t = useTranslations("calculator");
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [fresh, setFresh] = useState(true);
  const [error, setError] = useState(false);
  function apply() {
    const value = calculateCents(expression);
    if (value === null || value < 0) {
      setError(true);
      return;
    }
    onApply(value);
    setExpression(calculatorInput(value));
    setError(false);
    setFresh(true);
  }
  return (
    <div className="my-2 text-sm text-ink">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            if (!open) {
              setExpression(calculatorInput(cents));
              setFresh(true);
            }
            setOpen(!open);
          }}
          className="inline-flex min-h-11 items-center gap-2 font-semibold"
        >
          <Calculator size={17} strokeWidth={2} />
          {t("title")}
        </button>
      </div>
      {open && (
        <div className="rounded-[14px] border border-edge bg-track p-3">
          <input
            aria-label={t("expression")}
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value);
              setFresh(false);
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            onFocus={(e) => e.target.select()}
            inputMode="text"
            className="mb-2 min-h-11 w-full rounded-[10px] border border-edge bg-card px-3 text-right tabular-nums outline-none focus:border-primary"
          />
          <div className="grid grid-cols-4 gap-1.5">
            {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "C", "0", ".", "+"].map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  className="min-h-11 rounded-[10px] bg-card font-semibold hover:bg-primary-soft"
                  onClick={() => {
                    setExpression(
                      key === "C"
                        ? ""
                        : (fresh && /^[0-9.]$/.test(key) ? "" : expression) +
                            (key === "−" ? "-" : key),
                    );
                    setFresh(false);
                    setError(false);
                  }}
                >
                  {key}
                </button>
              ),
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              aria-label={t("backspace")}
              onClick={() => setExpression(expression.slice(0, -1))}
              className="flex min-h-11 items-center px-4"
            >
              <Delete size={17} />
            </button>
            <button
              type="button"
              onClick={apply}
              className="min-h-11 flex-1 rounded-[10px] bg-primary font-semibold text-onprimary"
            >
              = {t("apply")}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-muted">
              {t("invalid")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
