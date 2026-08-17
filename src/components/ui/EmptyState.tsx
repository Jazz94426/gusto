"use client";

import React from "react";
import clsx from "clsx";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center bg-cream-dark rounded-2xl border border-dashed border-stone",
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-stone">{icon}</div>}
      <h3 className="text-lg font-heading text-charcoal mb-2">{title}</h3>
      {description && <p className="text-sm text-brown mb-6 max-w-md">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
