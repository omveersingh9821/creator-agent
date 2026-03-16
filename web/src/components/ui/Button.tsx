import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  icon?: ReactNode;
}

export function Button({ children, variant = "primary", isLoading = false, icon, disabled, className = "", ...rest }: ButtonProps) {
  const base = "flex items-center cursor-pointer justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const style = variant === "primary"
    ? { background: "var(--c-green-muted)", color: "#fff", border: "1px solid var(--c-green)" }
    : { background: "var(--c-raised)", color: "var(--c-text-muted)", border: "1px solid var(--c-border)" };

  return (
    <button className={`${base} ${className}`} disabled={disabled || isLoading} style={style} {...rest}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
