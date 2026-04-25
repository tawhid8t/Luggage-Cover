import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 cursor-pointer border-none focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-white shadow-[0_4px_20px_rgba(74,144,226,0.4)] hover:shadow-[0_8px_28px_rgba(74,144,226,0.5)] hover:-translate-y-0.5",
        teal: "bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] text-[#0f1224] shadow-[0_4px_20px_rgba(64,224,208,0.3)] hover:shadow-[0_8px_28px_rgba(64,224,208,0.4)] hover:-translate-y-0.5 font-bold",
        outline:
          "bg-transparent border-2 border-brand-blue text-brand-blue hover:bg-gradient-primary hover:border-transparent hover:text-white",
        "outline-white":
          "bg-transparent border-2 border-white/40 text-white hover:bg-white/10 hover:border-white",
        dark: "bg-brand-navy text-white hover:bg-brand-dark hover:-translate-y-0.5",
        ghost:
          "bg-transparent text-brand-blue hover:bg-brand-blue/10",
        danger:
          "bg-ui-danger text-white hover:opacity-90",
      },
      size: {
        sm: "px-5 py-2 text-[0.85rem]",
        md: "px-7 py-3 text-[0.95rem]",
        lg: "px-10 py-4 text-[1.05rem]",
        icon: "w-10 h-10 p-0 rounded-full",
        "icon-sm": "w-8 h-8 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
