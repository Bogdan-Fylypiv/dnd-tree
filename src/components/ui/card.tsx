import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    const baseStyles = "rounded-md border bg-white p-4 shadow";

    return (
      <div ref={ref} className={clsx(baseStyles, className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className, ...props }) => {
  const baseStyles = "flex items-center mb-4 border-b pb-2";

  return (
    <div className={clsx(baseStyles, className)} {...props}>
      {children}
    </div>
  );
};

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className, ...props }) => {
  const baseStyles = "text-lg font-semibold leading-none";

  return (
    <h2 className={clsx(baseStyles, className)} {...props}>
      {children}
    </h2>
  );
};