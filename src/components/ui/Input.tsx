"use client";

import React, { forwardRef, useId } from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, helperText, error, multiline, rows = 3, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const Component = multiline ? "textarea" : "input";

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 text-sm font-medium text-charcoal">
            {label}
          </label>
        )}
        {/* @ts-ignore */}
        <Component
          id={inputId}
          ref={ref as any}
          rows={multiline ? rows : undefined}
          className={clsx(
            "w-full rounded-xl border border-stone bg-cream px-4 py-2 text-charcoal outline-none transition-colors duration-200 placeholder:text-stone focus:border-terracotta focus:ring-1 focus:ring-terracotta",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-brown">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
