export const SOCIAL_LINK_FIELDS = [
  {
    key: "instagram",
    label: "اینستاگرام",
    placeholder: "@username یا لینک صفحه",
    hint: "نام کاربری یا لینک صفحه"
  },
  {
    key: "telegram",
    label: "تلگرام",
    placeholder: "@username یا t.me/…",
    hint: "آیدی یا لینک"
  },
  {
    key: "website",
    label: "وب‌سایت",
    placeholder: "example.com",
    hint: "آدرس سایت شخصی یا کاری"
  },
  {
    key: "linkedin",
    label: "لینکدین",
    placeholder: "linkedin.com/in/username",
    hint: "لینک پروفایل لینکدین"
  }
] as const;

export type SocialLinkKey = (typeof SOCIAL_LINK_FIELDS)[number]["key"];

export function readSocialLinks(
  value: unknown
): Partial<Record<SocialLinkKey, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const source = value as Record<string, unknown>;
  const result: Partial<Record<SocialLinkKey, string>> = {};
  for (const field of SOCIAL_LINK_FIELDS) {
    const raw = source[field.key];
    if (typeof raw === "string" && raw.trim()) {
      result[field.key] = raw.trim();
    }
  }
  return result;
}

export function buildSocialLinks(input: {
  instagram?: string;
  telegram?: string;
  website?: string;
  linkedin?: string;
}): Record<string, string> | null {
  const links: Record<string, string> = {};
  for (const field of SOCIAL_LINK_FIELDS) {
    const value = input[field.key]?.trim();
    if (!value) continue;
    links[field.key] = normalizeSocialLink(field.key, value);
  }
  return Object.keys(links).length > 0 ? links : null;
}

export function socialLinkLabel(key: string) {
  return (
    SOCIAL_LINK_FIELDS.find((field) => field.key === key)?.label ?? key
  );
}

function normalizeSocialLink(key: SocialLinkKey, value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    if (key === "instagram") return `https://instagram.com/${handle}`;
    if (key === "telegram") return `https://t.me/${handle}`;
    if (key === "linkedin") return `https://linkedin.com/in/${handle}`;
  }
  if (key === "instagram" && !trimmed.includes(".")) {
    return `https://instagram.com/${trimmed}`;
  }
  if (key === "telegram" && !trimmed.includes(".")) {
    return `https://t.me/${trimmed}`;
  }
  if (key === "website") {
    return `https://${trimmed}`;
  }
  if (key === "linkedin" && !trimmed.includes("linkedin.com")) {
    return `https://linkedin.com/in/${trimmed.replace(/^\/+/, "")}`;
  }
  return `https://${trimmed}`;
}
