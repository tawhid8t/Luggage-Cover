"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

let toastHandler: ((props: ToastProps) => void) | null = null;

export function toast(message: string, type: ToastProps["type"] = "info", duration = 3500) {
  toastHandler?.({ message, type, duration });
}

function ToastContainer() {
  const [toasts, setToasts] = useState<
    (ToastProps & { id: number })[]
  >([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    toastHandler = ({ message, type, duration }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { message, type, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, (duration ?? 3000) + 400);
    };
    return () => {
      toastHandler = null;
    };
  }, []);

  if (!mounted) return null;

  const iconMap = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  return createPortal(
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg
            min-w-[280px] max-w-[360px] text-sm text-white font-medium
            animate-slide-in-right
            bg-brand-navy
            ${t.type === "success" ? "border-l-4 border-ui-success" : ""}
            ${t.type === "error" ? "border-l-4 border-ui-danger" : ""}
            ${t.type === "info" ? "border-l-4 border-brand-blue" : ""}
            ${t.type === "warning" ? "border-l-4 border-ui-warning" : ""}
          `}
          style={{
            borderLeftColor:
              t.type === "success"
                ? "#27ae60"
                : t.type === "error"
                  ? "#e74c3c"
                  : t.type === "warning"
                    ? "#f39c12"
                    : "#4A90E2",
          }}
        >
          <span>{iconMap[t.type || "info"]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}

export { ToastContainer };
