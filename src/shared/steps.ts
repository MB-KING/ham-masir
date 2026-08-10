import { XPTransactionType } from "@prisma/client";

/** Default گام amounts when StepRule rows are missing. */
export const defaultStepRules: Partial<Record<XPTransactionType, number>> = {
  ATTEND_EVENT: 100,
  REFER_USER: 50,
  CREATE_REWARD: 75,
  COMPLETE_PROFILE: 25,
  ATTEND_SPECIAL_EVENT: 150
};

export const earnStepTypes: XPTransactionType[] = [
  XPTransactionType.ATTEND_EVENT,
  XPTransactionType.REFER_USER,
  XPTransactionType.CREATE_REWARD,
  XPTransactionType.COMPLETE_PROFILE,
  XPTransactionType.ATTEND_SPECIAL_EVENT
];

export const stepTypeLabels: Record<XPTransactionType, string> = {
  ATTEND_EVENT: "حضور در برنامه",
  REFER_USER: "معرفی عضو",
  CREATE_REWARD: "ایجاد مزیت",
  COMPLETE_PROFILE: "تکمیل پروفایل",
  ATTEND_SPECIAL_EVENT: "حضور در برنامه ویژه",
  SPEND_REWARD: "خرج برای مزیت",
  ADMIN_ADJUSTMENT: "تنظیم ادمین"
};

export function formatSteps(amount: number) {
  return `${amount.toLocaleString("fa-IR")} گام`;
}
