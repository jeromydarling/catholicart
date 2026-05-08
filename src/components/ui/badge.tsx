import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-parchment-200 text-ink-soft",
        burgundy: "bg-burgundy-500/10 text-burgundy-600 ring-1 ring-burgundy-500/20",
        gold: "bg-gold-500/15 text-gold-600 ring-1 ring-gold-500/30",
        lapis: "bg-lapis-600/10 text-lapis-700 ring-1 ring-lapis-600/20",
        olive: "bg-olive-500/15 text-olive-600 ring-1 ring-olive-500/30",
        outline: "border border-ink/15 text-ink-soft",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
