export const SOCIAL_LINK_FIELDS = [
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
  return SOCIAL_LINK_FIELDS.find((field) => field.key === key)?.label ?? key;
}

function normalizeSocialLink(key: SocialLinkKey, value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (key === "website") {
    return `https://${trimmed}`;
  }
  if (key === "linkedin") {
    const handle = trimmed.replace(/^@/, "").replace(/^\/+/, "");
    if (!handle.includes("linkedin.com")) {
      return `https://linkedin.com/in/${handle}`;
    }
  }
  return `https://${trimmed}`;
}
