import {cn} from "../../lib/utils"
import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";


export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-theme-primary text-theme-primary-foreground hover:bg-theme-primary/90",
                danger:
                    "bg-theme-destructive text-white hover:bg-theme-destructive/90",
                bordered:
                    "border border-theme-border bg-theme-background hover:bg-theme-muted hover:text-theme-foreground",
                subtle:
                    "bg-theme-muted text-theme-muted-foreground hover:bg-theme-muted/80",
                clear:
                    "hover:bg-theme-muted hover:text-theme-foreground",
                anchor:
                    "text-theme-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 px-3 text-sm",
                lg: "h-12 px-6 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({className, variant, size, ...props}, ref) => {
        return (
            <button
                ref={ref}
                className={cn(buttonVariants({variant, size}), className)}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";