import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const PRIMARY = "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: PRIMARY,
        default: PRIMARY,
        seal: "bg-seal text-seal-foreground shadow-sm hover:brightness-105",
        outline: "border border-input bg-card text-foreground hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        onCover: "border border-cover-foreground/30 text-cover-foreground hover:bg-cover-foreground/10",
        success: "bg-verified text-primary-foreground shadow-sm",
      },
      size: {
        sm: "min-h-9 px-3 text-sm",
        md: "min-h-11 px-4 text-sm",
        default: "min-h-9 px-4 text-sm",
        lg: "min-h-12 px-6 text-base",
        icon: "size-9 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
});
