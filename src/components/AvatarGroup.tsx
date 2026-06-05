import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  avatars: { name: string; color?: string }[];
  max?: number;
  size?: "sm" | "md";
}

const colors = [
  "bg-primary", "bg-secondary", "bg-success", "bg-accent",
];

export const AvatarGroup = ({ avatars, max = 4, size = "md" }: AvatarGroupProps) => {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs";

  return (
    <div className="flex -space-x-2">
      {displayed.map((a, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full border-2 border-card flex items-center justify-center font-medium text-primary-foreground",
            sizeClass,
            colors[i % colors.length]
          )}
          title={a.name}
        >
          {a.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn("rounded-full border-2 border-card flex items-center justify-center bg-muted text-muted-foreground font-medium", sizeClass)}>
          +{remaining}
        </div>
      )}
    </div>
  );
};
