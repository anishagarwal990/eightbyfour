export function SaveIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 4a1 1 0 0 0-1 1v15l7-4.5 7 4.5V5a1 1 0 0 0-1-1H6Z" />
    </svg>
  );
}
