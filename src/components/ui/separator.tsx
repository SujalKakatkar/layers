import {cn} from "../../lib/utils"
import * as React from "react"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical"
}

export function Separator ({
    className,
    orientation = "horizontal",
    ...props
}: SeparatorProps) {
    return (
        <div
            role="separator"
            {...(orientation === "vertical" ? {"aria-orientation": "vertical"} : {})}
            className={cn(
                "shrink-0 bg-theme-border",
                orientation === "horizontal"
                    ? "h-px w-full"
                    : "w-px h-full",
                className
            )}
            {...props}
        />
    )
}