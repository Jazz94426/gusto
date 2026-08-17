"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={clsx(
        "relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col bg-cream rounded-t-3xl sm:rounded-2xl shadow-xl transform transition-transform duration-300 animate-slide-up sm:animate-fade-in",
        className
      )}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone/20">
          {title && <h2 className="text-xl font-heading text-charcoal">{title}</h2>}
          <button 
            onClick={onClose}
            className="p-2 ml-auto text-stone hover:text-charcoal transition-colors rounded-full hover:bg-cream-dark"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
};
