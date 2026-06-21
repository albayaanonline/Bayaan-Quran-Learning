interface LogoProps {
  variant?: "blue" | "white" | "dark" | "auto";
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

function ABMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M 24 5 L 47 5 L 21 95 L 0 95 Z" fill="currentColor" />
      <rect x="49" y="5" width="13" height="90" fill="currentColor" />
      <rect x="26" y="49" width="36" height="10" fill="currentColor" />
      <path d="M 62 5 C 62 5 87 5 87 28 C 87 50 62 50 62 50 Z" fill="currentColor" />
      <path d="M 62 51 C 62 51 90 51 90 73 C 90 95 62 95 62 95 Z" fill="currentColor" />
    </svg>
  );
}

export default function AlBayaanLogo({
  variant = "auto",
  className = "",
  showText = true,
  textClassName = "",
}: LogoProps) {
  const colorClass =
    variant === "blue"
      ? "text-blue-700 dark:text-blue-400"
      : variant === "white"
      ? "text-white"
      : variant === "dark"
      ? "text-slate-900"
      : "text-slate-900 dark:text-white";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ABMark className={`h-8 w-auto shrink-0 ${colorClass}`} />
      {showText && (
        <div className={`flex flex-col leading-none ${textClassName}`}>
          <span
            className={`text-sm font-bold tracking-tight ${colorClass}`}
          >
            Al Bayaan
          </span>
          <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
            AI Academy
          </span>
        </div>
      )}
    </div>
  );
}

export { ABMark };
