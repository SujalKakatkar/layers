import {cn} from "../../lib/utils"
import {cva} from "class-variance-authority";

export function CardRoot ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl relative border bg-card text-theme-card-foreground shadow-sm",
                className
            )}
            {...props}
        />
    );
}

export function CardHeaderSection ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex flex-col gap-1 p-4", className)} {...props} />
    );
}

export function CardHeading ({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn("text-lg font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    );
}

export function CardSubtext ({
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-sm text-theme-muted-foreground", className)} {...props} />
    );
}

export function CardContainer ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-4 pt-0", className)} {...props} />
    );
}

export function CardBody ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex flex-col flex-1 p-4 gap-2", className)}
            {...props}
        />
    );
}

export function CardFooterSection ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center p-4 pt-0", className)} {...props} />
    );
}

export type CardIconPosition =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

const cardIconVariants = cva("absolute", {
    variants: {
        position: {
            "top-left": "top-4 left-4",
            "top-right": "top-4 right-4",
            "bottom-left": "bottom-4 left-4",
            "bottom-right": "bottom-4 right-4",
        },
    },
    defaultVariants: {
        position: "top-right",
    },
});

export function CardIcon ({
    position,
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    position?: CardIconPosition;
}) {
    return (
        <div
            className={cn(cardIconVariants({position}), className)}
            {...props}
        >
            {children}
        </div>
    );
}