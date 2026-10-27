"use client";

import { Children, Fragment, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Circle } from "lucide-react";
import { EntitySymbol } from "./EntitySymbol";

type Option = { value: string; label: ReactNode; text: string; disabled: boolean; icon?: string };
type Props = SelectHTMLAttributes<HTMLSelectElement>;

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? textOf(child.props.children)
        : String(child ?? ""),
    )
    .join("");
}
function optionsOf(children: ReactNode, disabled = false): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
        "data-icon"?: string;
      }>(child)
    )
      return [];
    const props = child.props;
    if (child.type === Fragment || child.type === "optgroup")
      return optionsOf(props.children, disabled || props.disabled);
    if (child.type !== "option") return [];
    return [
      {
        value: String(props.value ?? textOf(props.children)),
        label: props.children,
        text: textOf(props.children),
        disabled: disabled || Boolean(props.disabled),
        icon: props["data-icon"],
      },
    ];
  });
}

/** Native form semantics behind a keyboard-operable themed listbox. A portal
 * avoids clipping in tables/dialogs; copying ledger context preserves tokens. */
export function Select({
  children,
  className = "",
  value,
  defaultValue,
  disabled,
  id,
  style,
  onChange,
  ...props
}: Props) {
  const uid = useId();
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue ?? ""));
  const [position, setPosition] = useState({ left: 0, top: 0, width: 280, maxHeight: 320 });
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [context, setContext] = useState<string | undefined>();
  const options = optionsOf(children);
  const selected = String(value ?? uncontrolled);
  const current = options.find((option) => option.value === selected) ?? options[0];
  const label = props["aria-label"];

  function close() {
    setOpen(false);
  }
  function show() {
    if (disabled || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 300), window.innerWidth - 24);
    const below = window.innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const useBelow = below >= 200 || below >= above;
    const height = Math.min(360, useBelow ? below : above);
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: useBelow ? rect.bottom + 6 : Math.max(12, rect.top - height - 6),
      width,
      maxHeight: Math.max(100, height),
    });
    setPortalHost(trigger.current.closest<HTMLElement>('[role="dialog"]') ?? document.body);
    setContext(
      trigger.current.closest<HTMLElement>("[data-ledger-context]")?.dataset.ledgerContext,
    );
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === selected && !option.disabled),
      ),
    );
    setOpen(true);
  }
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled || !native.current) return;
    setUncontrolled(option.value);
    native.current.value = option.value;
    // Dispatch through the native control so existing React change handlers,
    // form validation and callers all receive a real select target.
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    close();
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        close();
    };
    const scroll = (event: Event) => {
      if (!popup.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close);
    document.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", scroll, true);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      popup.current
        ?.querySelector(`[data-option-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  return (
    <>
      <select
        {...props}
        ref={native}
        value={value ?? uncontrolled}
        disabled={disabled}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        aria-label={undefined}
        id={undefined}
        hidden
        className="sr-only"
        onInvalid={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        {children}
      </select>
      <button
        type="button"
        ref={trigger}
        id={id}
        disabled={disabled}
        style={style}
        role="combobox"
        aria-label={label ?? (id ? undefined : current?.text)}
        aria-labelledby={props["aria-labelledby"]}
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-haspopup="listbox"
        aria-required={props.required || props["aria-required"]}
        aria-describedby={props["aria-describedby"]}
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        title={props.title}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            if (open) {
              event.stopPropagation();
              event.preventDefault();
            }
            close();
            return;
          }
          if (event.key === "Tab") {
            close();
            return;
          }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!open) {
              show();
              return;
            }
            const step = event.key === "ArrowUp" || event.key === "End" ? -1 : 1;
            let index =
              event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : active + step;
            while (index >= 0 && index < options.length && options[index].disabled) index += step;
            if (index >= 0 && index < options.length) setActive(index);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(active);
            else show();
          } else if (event.key.length === 1) {
            const index = options.findIndex(
              (option) =>
                !option.disabled &&
                option.text.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()),
            );
            if (index >= 0) {
              if (!open) show();
              setActive(index);
            }
          }
        }}
        className={`themed-select-trigger ${className}`}
      >
        {current?.icon && <EntitySymbol emoji={current.icon} size={16} />}
        <span className="min-w-0 flex-1 truncate text-left">{current?.label}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      </button>
      {open &&
        !disabled &&
        createPortal(
          <div
            data-ledger-context={context}
            ref={popup}
            className="themed-select-popover"
            style={{ position: "fixed", ...position, zIndex: 160 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              id={`${uid}-list`}
              role="listbox"
              aria-label={label}
              aria-labelledby={props["aria-labelledby"]}
              className="themed-select-options"
              style={{ maxHeight: position.maxHeight }}
            >
              {options.map((option, index) => (
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  id={`${uid}-${index}`}
                  key={`${option.value}-${index}`}
                  data-option-index={index}
                  aria-selected={option.value === current?.value}
                  disabled={option.disabled}
                  data-active={index === active}
                  className="themed-select-option"
                  onPointerMove={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                >
                  <span className="themed-select-symbol">
                    {option.icon ? (
                      <EntitySymbol emoji={option.icon} size={19} />
                    ) : (
                      <Circle size={17} strokeWidth={2} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{option.label}</span>
                  {option.value === current?.value && (
                    <Check
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="themed-select-check"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>,
          portalHost ?? document.body,
        )}
    </>
  );
}
