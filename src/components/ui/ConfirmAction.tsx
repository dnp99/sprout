"use client";

import { useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "./ConfirmDialog";

/** Defer the original action until confirmation; cancellation performs no mutation. */
export function ConfirmAction({
  href,
  onClick,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { href?: string }) {
  const t = useTranslations("destructiveAction");
  const [pending, setPending] = useState<MouseEvent<HTMLButtonElement> | true | null>(null);
  const label =
    props["aria-label"] ?? props.title ?? (typeof children === "string" ? children : t("delete"));
  return (
    <>
      {href ? (
        <a
          href={href}
          role={props.role}
          className={props.className}
          aria-label={props["aria-label"]}
          onClick={(event) => {
            event.preventDefault();
            setPending(true);
          }}
        >
          {children}
        </a>
      ) : (
        <button
          {...props}
          data-destructive-action=""
          type={props.type ?? "button"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setPending(event);
          }}
        >
          {children}
        </button>
      )}
      {pending &&
        createPortal(
          <div
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <ConfirmDialog
              title={t("title")}
              message={t("message", { action: label })}
              confirmLabel={t("confirm")}
              cancelLabel={t("cancel")}
              onCancel={() => setPending(null)}
              onConfirm={() => {
                const event = pending;
                setPending(null);
                if (href) window.location.assign(href);
                else if (event !== true) onClick?.(event);
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
