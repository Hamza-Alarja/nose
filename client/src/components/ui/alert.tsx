import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border px-5 py-4 text-sm grid has-[>svg]:grid-cols-[48px_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-4 gap-y-0.5 items-start [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ivory)] text-[var(--charcoal)] border-[var(--border)] shadow-[0_8px_24px_rgba(23,19,17,0.06)]",
        destructive:
          "bg-[var(--ivory)] text-[var(--charcoal)] border-[2px] border-[var(--gold)] [&>svg]:text-[var(--gold)] *:data-[slot=alert-description]:text-[var(--charcoal)]/85 shadow-[0_8px_24px_rgba(23,19,17,0.06)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
