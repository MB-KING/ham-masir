import {
  RewardRedemptionStatus,
  RewardStatus,
  RewardType
} from "@prisma/client";
import { notFound } from "next/navigation";
import {
  addRewardCodesAction,
  setRedemptionStatusAction,
  updateRewardAction
} from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";
import { dateInputValue } from "@/shared/form-date";
import { labelOf, rewardStatusLabels, rewardTypeLabels } from "@/shared/labels";

export default async function EditRewardPage({
  params
}: {
  params: Promise<{ rewardId: string }>;
}) {
  await requireSuperAdminPage();
  const { rewardId } = await params;
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: {
      business: true,
      codes: { orderBy: { createdAt: "asc" } },
      redemptions: {
        orderBy: { createdAt: "desc" },
        include: { user: true, rewardCode: true }
      }
    }
  });

  if (!reward) {
    notFound();
  }

  return (
    <>
      <PageTitle
        showBack
        backFallbackHref="/admin/rewards"
        title="ویرایش مزیت"
        subtitle={`مزیت ثبت‌شده برای ${reward.business.name} را اصلاح کن.`}
      />
      <AdminCard>
        <form action={updateRewardAction} className="grid gap-4">
          <input type="hidden" name="rewardId" value={reward.id} />
          <Field
            name="title"
            label="عنوان مزیت"
            required
            defaultValue={reward.title}
          />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            نوع مزیت
            <select
              name="type"
              defaultValue={reward.type}
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
            >
              {Object.values(RewardType).map((type) => (
                <option key={type} value={type}>
                  {labelOf(rewardTypeLabels, type)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            وضعیت
            <select
              name="status"
              defaultValue={reward.status}
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
            >
              {Object.values(RewardStatus).map((status) => (
                <option key={status} value={status}>
                  {labelOf(rewardStatusLabels, status)}
                </option>
              ))}
            </select>
          </label>
          <Field
            name="discountValue"
            label="مقدار یا ارزش مزیت"
            defaultValue={reward.discountValue ?? ""}
          />
          <Field
            name="discountCode"
            label="کد عمومی"
            defaultValue={reward.discountCode ?? ""}
          />
          <Field
            name="image"
            label="آدرس تصویر مزیت"
            type="url"
            defaultValue={reward.image ?? ""}
          />
          <Field
            name="startAt"
            label="شروع اعتبار"
            type="date"
            required
            defaultValue={dateInputValue(reward.startAt)}
          />
          <Field
            name="expireAt"
            label="پایان اعتبار"
            type="date"
            required
            defaultValue={dateInputValue(reward.expireAt)}
          />
          <Field
            name="minimumAttendance"
            label="حداقل حضور لازم"
            type="number"
            defaultValue={
              reward.minimumAttendance ? String(reward.minimumAttendance) : ""
            }
          />
          <Field
            name="minimumLevel"
            label="حداقل سطح عضو"
            type="number"
            defaultValue={
              reward.minimumLevel ? String(reward.minimumLevel) : ""
            }
          />
          <Field
            name="requiredXP"
            label="هزینه گام"
            type="number"
            defaultValue={reward.requiredXP ? String(reward.requiredXP) : ""}
          />
          <Field
            name="usageLimit"
            label="ظرفیت کل مزیت"
            type="number"
            defaultValue={reward.usageLimit ? String(reward.usageLimit) : ""}
          />
          <Field
            name="perUserLimit"
            label="سقف دریافت هر عضو"
            type="number"
            defaultValue={
              reward.perUserLimit ? String(reward.perUserLimit) : ""
            }
          />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            توضیحات استفاده
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={reward.description}
              className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]"
            />
          </label>
          <div>
            <button
              className="min-h-11 w-full rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#061124]"
              type="submit"
            >
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </AdminCard>
      <AdminCard className="mt-5">
        <h2 className="font-black text-white">دریافت‌های اعضا</h2>
        <p className="mt-2 text-sm text-slate-400">
          وضعیت تحویل یا لغو هر دریافت را ثبت کن تا ظرفیت مزیت درست محاسبه شود.
        </p>
        <div className="mt-4 grid gap-2">
          {reward.redemptions.length === 0 ? (
            <p className="text-sm text-slate-400">
              هنوز کسی این مزیت را دریافت نکرده است.
            </p>
          ) : (
            reward.redemptions.map((item) => {
              const name =
                [item.user.firstName, item.user.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                item.user.username ||
                "عضو";
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.05] p-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      کد:{" "}
                      {item.rewardCode?.code ??
                        reward.discountCode ??
                        "بدون کد"}{" "}
                      · وضعیت: {redemptionStatusLabel(item.status)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.values(RewardRedemptionStatus).map((status) => (
                      <form key={status} action={setRedemptionStatusAction}>
                        <input
                          type="hidden"
                          name="redemptionId"
                          value={item.id}
                        />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          disabled={item.status === status}
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-300 disabled:bg-[#F59E0B]/15 disabled:text-[#F59E0B]"
                        >
                          {redemptionStatusLabel(status)}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </AdminCard>
      <AdminCard className="mt-5">
        <h2 className="font-black text-white">کدهای اختصاصی</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          هر کد فقط یک‌بار به یک عضو اختصاص داده می‌شود. کدهای استفاده‌شده برای
          حفظ سابقه حذف نمی‌شوند.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reward.codes.length === 0 ? (
            <span className="text-sm text-slate-400">
              هنوز کدی ثبت نشده است.
            </span>
          ) : (
            reward.codes.map((code) => (
              <span
                key={code.id}
                className={
                  code.isRedeemed
                    ? "rounded-full bg-white/[0.05] px-3 py-1 text-xs text-slate-500 line-through"
                    : "rounded-full bg-emerald-400/10 px-3 py-1 font-mono text-xs text-emerald-200"
                }
              >
                {code.code}
              </span>
            ))
          )}
        </div>
        <form action={addRewardCodesAction} className="mt-4 grid gap-3">
          <input type="hidden" name="rewardId" value={reward.id} />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            افزودن کد، هر خط یک کد
            <textarea
              name="codes"
              required
              rows={5}
              className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 font-mono text-sm text-white outline-none focus:border-[#F59E0B]"
              placeholder={"CODE-101\nCODE-102"}
            />
          </label>
          <button
            type="submit"
            className="h-11 w-fit rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#061124]"
          >
            افزودن کدها
          </button>
        </form>
      </AdminCard>
    </>
  );
}

function redemptionStatusLabel(status: RewardRedemptionStatus) {
  return {
    RESERVED: "رزرو شده",
    REDEEMED: "تحویل شده",
    CANCELLED: "لغو شده",
    EXPIRED: "منقضی"
  }[status];
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  className
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label
      className={`grid gap-2 text-sm font-bold text-slate-200 ${className ?? ""}`}
    >
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
      />
    </label>
  );
}
