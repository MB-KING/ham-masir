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

export const rewardStatusLabels: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "فعال",
  REJECTED: "رد شده",
  EXPIRED: "منقضی",
  DISABLED: "غیرفعال"
};

export const rewardTypeLabels: Record<string, string> = {
  DISCOUNT: "تخفیف",
  FREE_ITEM: "هدیه",
  SERVICE: "خدمت",
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
