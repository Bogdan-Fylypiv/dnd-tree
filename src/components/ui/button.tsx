import React from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick, className, variant = "default", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

    const variants = {
      default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
      ghost: "bg-transparent text-blue-500 hover:bg-gray-100 focus:ring-blue-500",
    };

    const sizes = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-5 py-3 text-lg",
      icon: "p-2 text-lg",
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