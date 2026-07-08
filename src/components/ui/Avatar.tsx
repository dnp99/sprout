/** Circular account avatar. Shows a single initial when `initial` is given
 *  (e.g. the greeting name's first letter), otherwise a generic person icon. */
export function Avatar({
  size = 42,
  initial,
  iconColor = "#b26a3a",
  className,
}: {
  size?: number;
  initial?: string;
  iconColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full ${
        initial ? "bg-subtle" : "bg-peach"
      } ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {initial ? (
        <span className="font-display font-extrabold text-ink" style={{ fontSize: size * 0.42 }}>
          {initial.toUpperCase()}
        </span>
      ) : (
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 24 24"
          fill={iconColor}
          aria-hidden
        >
          <circle cx="12" cy="8.5" r="3.8" />
          <path d="M5 19.6c0-3.7 3.1-5.9 7-5.9s7 2.2 7 5.9a.6.6 0 0 1-.6.6H5.6a.6.6 0 0 1-.6-.6Z" />
        </svg>
      )}
    </span>
  );
}
