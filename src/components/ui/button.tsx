import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-sans text-sm font-medium tracking-wide transition-all focusable disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-burgundy-500 text-parchment-50 hover:bg-burgundy-600 active:bg-burgundy-700 shadow-sm",
        outline:
          "border border-ink/15 bg-parchment-50/60 text-ink hover:bg-parchment-100 hover:border-ink/25",
        ghost: "text-ink hover:bg-parchment-100",
        link: "text-burgundy-500 underline-offset-4 hover:underline",
        gold:
          "bg-gold-500 text-parchment-50 hover:bg-gold-600 shadow-sm",
        ink: "bg-ink text-parchment-50 hover:bg-ink-soft",
      },
      size: {
        sm: "h-9 rounded-sm px-3 text-xs",
        default: "h-11 rounded-sm px-5",
        lg: "h-12 rounded-sm px-7 text-base",
        icon: "h-10 w-10 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
