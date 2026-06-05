import { cn } from "@/lib/utils";

type StatusBadgeVariant = "positive" | "negative" | "neutral" | "info";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  positive: "bg-success/10 text-success",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-secondary/10 text-secondary",
};

export const StatusBadge = ({ variant, children, className }: StatusBadgeProps) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
    {children}
  </span>
);
