"use client";

import React from "react";
import clsx from "clsx";

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, description, className, ...props }) => {
  return (
    <label className={clsx("flex items-center cursor-pointer", className)}>
      <div className="relative">
        <input type="checkbox" className="sr-only" {...props} />
        <div className={clsx(
          "block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out",
          props.checked ? "bg-terracotta" : "bg-stone"
        )}></div>
        <div className={clsx(
          "absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-sm",
          props.checked ? "transform translate-x-6" : ""
        )}></div>
      </div>
      {(label || description) && (
        <div className="ml-3 flex flex-col">
          {label && <span className="text-sm font-medium text-charcoal">{label}</span>}
          {description && <span className="text-xs text-brown">{description}</span>}
        </div>
      )}
    </label>
  );
};
