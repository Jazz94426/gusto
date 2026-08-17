"use client";

import React, { forwardRef } from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  imageHeader?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", imageHeader, children, onClick, ...props }, ref) => {
    const baseStyles = "bg-white rounded-[24px] border border-stone-light/30 overflow-hidden transition-all duration-300";
    
    const variants = {
      default: "shadow-sm",
      elevated: "shadow-md",
      interactive: "shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          baseStyles,
          variants[onClick || variant === "interactive" ? "interactive" : variant],
          className
        )}
        onClick={onClick}
        {...props}
      >
        {imageHeader && <div className="w-full object-cover">{imageHeader}</div>}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    );
  }
);
Card.displayName = "Card";
