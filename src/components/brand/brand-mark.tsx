import Image from "next/image";
import { cn } from "@/lib/cn";

const brandIconSrc = "/brand/ham-masir-icon.png";

export function BrandMark({
  size = 40,
  className,
  priority = false
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[22%] ring-1 ring-white/15",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={brandIconSrc}
        alt="هم مسیر"
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
