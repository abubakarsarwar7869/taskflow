import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-primary text-primary bg-transparent hover:text-white hover:border-transparent",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "bg-transparent text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-9 px-5",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const [pos, setPos] = React.useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    return (
      <Comp
        ref={ref}
        onMouseMove={handleMouseMove}
        style={
          {
            "--x": `${pos.x}%`,
            "--y": `${pos.y}%`,
          } as React.CSSProperties
        }
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Hover grow background */}
        <span
          className="
            absolute inset-0
            rounded-[40px]
            scale-0
            group-hover:scale-100
            transition-transform
            duration-300
            pointer-events-none
            bg-[#4280c4]
          "
          style={{
            transformOrigin: "var(--x) var(--y)",
          }}
        />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-white [&>svg]:transition-colors">
          {children}
        </span>
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
