export const eventStatusLabels: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "آماده ثبت‌نام",
  REGISTRATION_CLOSED: "ثبت‌نام بسته",
  COMPLETED: "برگزار شده",
  CANCELLED: "لغو شده"
};

export const registrationStatusLabels: Record<string, string> = {
  REGISTERED: "ثبت‌نام شده",
  CANCELLED: "انصراف داده",
  WAITLISTED: "در لیست انتظار"
};

export const attendanceStatusLabels: Record<string, string> = {
  PENDING: "در انتظار بررسی",
  PRESENT: "حاضر",
  ABSENT: "غایب",
  REJECTED: "رد شده"
};

export const businessStatusLabels: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  DISABLED: "غیرفعال"
};

export const moderationStatusLabels: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده"
};

export const rewardStatusLabels: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "فعال",
  REJECTED: "رد شده",
  EXPIRED: "منقضی",
  DISABLED: "غیرفعال"
};

export const rewardRedemptionStatusLabels: Record<string, string> = {
  RESERVED: "رزرو شده",
  REDEEMED: "استفاده شده",
  CANCELLED: "لغو شده",
  EXPIRED: "منقضی"
};

export const rewardTypeLabels: Record<string, string> = {
  DISCOUNT: "کد تخفیف",
  FREE_ITEM: "هدیه",
  SERVICE: "خدمت رایگان",
  GIFT: "هدیه ویژه",
  CREDIT: "اعتبار",
  SPECIAL_OFFER: "پیشنهاد ویژه",
  OTHER: "سایر"
};

export const roleLabels: Record<string, string> = {
  USER: "عضو",
  ADMIN: "ادمین",
  SUPER_ADMIN: "سوپرادمین"
};

export function labelOf(labels: Record<string, string>, value?: string | null) {
  if (!value) {
    return "ثبت نشده";
  }
  return labels[value] ?? value;
}
