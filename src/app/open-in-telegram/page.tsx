import { Send } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { UserCard } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { botUsername } from "@/lib/telegram-format";

export default function OpenInTelegramPage() {
  const username = botUsername();
  const botHref = `https://t.me/${username}`;

  return (
    <UserPageShell>
      <UserCard className="mt-8 text-center">
        <div className="mx-auto flex justify-center">
          <BrandMark size={72} />
        </div>
        <h1 className="mt-4 text-2xl font-black text-white">
          از داخل تلگرام باز کن
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          ۱. ربات را باز کن و <span className="font-bold text-white">/start</span>{" "}
          بزن.
          <br />
          ۲. دکمه <span className="font-bold text-white">باز کردن هم مسیر</span>{" "}
          یا منوی پایین چت را بزن.
          <br />
          ۳. مینی‌اپ داخل تلگرام باز می‌شود و لاگین خودکار انجام می‌شود.
        </p>
        <p className="mt-3 text-xs leading-6 text-slate-400">
          باز کردن سایت در مرورگر معمولی لاگین تلگرام ندارد.
        </p>
        <a
          href={botHref}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
        >
          <Send size={17} aria-hidden="true" />
          باز کردن ربات @{username ?? "HamMasirClubBot"}
        </a>
        <Link
          href="/"
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 text-sm font-bold text-slate-200"
        >
          بازگشت به خانه
        </Link>
      </UserCard>
    </UserPageShell>
  );
}
