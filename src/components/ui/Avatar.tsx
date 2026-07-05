/** Circular account avatar with a person icon on the peach fill. */
export function Avatar({
  size = 42,
  iconColor = "#b26a3a",
  className,
}: {
  size?: number;
  iconColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-peach ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
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
    </span>
  );
}
