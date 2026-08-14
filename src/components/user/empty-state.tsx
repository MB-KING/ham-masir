import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { UserCard } from "@/components/user/user-card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <UserCard className="py-10 text-center">
      <Icon className="mx-auto text-slate-500" size={32} aria-hidden="true" />
      <h3 className="mt-3 font-black text-white">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </UserCard>
  );
}
