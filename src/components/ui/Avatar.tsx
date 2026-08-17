"use client";

import React from "react";
import clsx from "clsx";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  initials,
  size = "md",
  className,
  ...props
}) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-cream-dark shadow-sm border border-stone/20",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || "Avatar"} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-charcoal">
          {initials || alt?.charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
};
