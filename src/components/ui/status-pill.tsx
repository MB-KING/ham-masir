import { eventStatusLabels, labelOf } from "@/shared/labels";

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1 text-xs font-bold text-[#FBBF24]">
      {labelOf(eventStatusLabels, status)}
    </span>
  );
}
