import { cn } from "@/lib/cn";
import { miniAppWidthClass } from "@/components/user/mini-app";
import { UserNav } from "@/components/user/user-nav";

export { miniAppWidthClass };

export function UserPageShell({
  children,
  className,
  contentClassName
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** @deprecated Kept for call-site compatibility; Mini App has one width only. */
  width?: "default" | "narrow";
}) {
  return (
    <main className={cn("min-h-screen overflow-x-clip text-slate-100", className)}>
      <div
        className={cn(
          "mx-auto px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-5",
          miniAppWidthClass,
          contentClassName
        )}
      >
        {children}
      </div>
      <UserNav />
    </main>
  );
}

export const secondaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-slate-200 transition active:scale-[0.99] hover:border-[#F59E0B]/40 hover:text-white";

export const secondaryActionInlineClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-sm font-bold text-slate-200 transition active:scale-[0.99] hover:border-[#F59E0B]/40 hover:text-white";
