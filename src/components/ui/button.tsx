import React from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isIconOnly?: boolean; // Compact size for specific icon-only buttons
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick, className, variant = "default", size = "md", isIconOnly = false, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

    const variants = {
      default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
      ghost: "bg-transparent text-blue-500 hover:bg-gray-100 focus:ring-blue-500",
    };

    const sizes = {
      sm: "px-2 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      icon: isIconOnly ? "w-4 h-4 p-0 text-xs" : "w-8 h-8 p-0 text-base",
    };

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";