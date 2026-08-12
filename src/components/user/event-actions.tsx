"use client";

import { RegistrationStatus } from "@prisma/client";
import { CalendarCheck2, Loader2, LogOut, Send } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cancelEventRegistrationAction,
  registerForEventAction
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { secondaryActionClass } from "@/components/user/user-action-styles";
import { botUsername } from "@/lib/telegram-format";

function readTelegramInitData() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp?.initData?.trim() || null;
}

async function loginWithTelegramInitData(initData: string) {
  const response = await fetch("/api/auth/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });
  if (!response.ok) {
    throw new Error("telegram_login_failed");
  }
}

export function EventActions({
  eventId,
  registrationStatus,
  requiresLogin = false
}: {
  eventId: string;
  registrationStatus?: RegistrationStatus | null;
  requiresLogin?: boolean;
}) {
  if (requiresLogin) {
    return <LoginThenRegisterButton eventId={eventId} />;
  }

  if (
    registrationStatus === RegistrationStatus.REGISTERED ||
    registrationStatus === RegistrationStatus.WAITLISTED
  ) {
    return (
      <form action={cancelEventRegistrationAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <PendingSubmitButton
          className={`${secondaryActionClass} border-red-400/30 text-red-200 hover:border-red-400/50 hover:bg-red-500/10`}
          pendingLabel="در حال لغو…"
          idleIcon={<LogOut size={16} aria-hidden="true" />}
        >
          {registrationStatus === RegistrationStatus.WAITLISTED
            ? "خروج از لیست انتظار"
            : "لغو ثبت‌نام"}
        </PendingSubmitButton>
      </form>
    );
  }

  return (
    <form action={registerForEventAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        className="w-full"
        type="submit"
        pendingLabel="در حال ثبت‌نام…"
      >
        <CalendarCheck2 size={17} aria-hidden="true" />
        ثبت‌نام و رزرو جا
      </Button>
    </form>
  );
}

function LoginThenRegisterButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openBot() {
    const username = botUsername();
    const href = username
      ? `https://t.me/${username}`
      : "/open-in-telegram";
    if (window.Telegram?.WebApp?.openTelegramLink && username) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/${username}`);
      return;
    }
    window.location.assign(href);
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        let initData = readTelegramInitData();

        // Mini App script may still be loading — wait briefly.
        if (!initData) {
          for (let i = 0; i < 10 && !initData; i += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 150));
            initData = readTelegramInitData();
          }
        }

        if (!initData) {
          openBot();
          return;
        }

        await loginWithTelegramInitData(initData);

        const formData = new FormData();
        formData.set("eventId", eventId);
        await registerForEventAction(formData);
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        setError(
          "ورود از تلگرام انجام نشد. یک‌بار دیگر از داخل ربات هم مسیر باز کن."
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124] disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            در حال ورود و ثبت‌نام…
          </>
        ) : (
          <>
            <Send size={17} aria-hidden="true" />
            ورود از تلگرام و ثبت‌نام
          </>
        )}
      </button>
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold leading-5 text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
