import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base " +
        "ring-offset-background file:0 file:transparent file:sm file:medium file:foreground " +
        "placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
        "disabled:cursor-not-allowed disabled:opacity-50 md-sm",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
