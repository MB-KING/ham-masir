import { UserRound } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function UserAvatar({
  photoUrl,
  name,
  size = 56,
  className
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-white/10",
        className
      )}
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ember">
          <UserRound size={Math.round(size * 0.45)} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
