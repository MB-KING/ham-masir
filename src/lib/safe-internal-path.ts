/** Allow only same-origin relative paths after Telegram Login Widget redirect. */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value) {
    return fallback;
  }

  let path = value.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!path.startsWith("/")) {
    return fallback;
  }

  if (
    path.startsWith("//") ||
    path.includes("://") ||
    path.includes("\\") ||
    path.startsWith("/open-in-telegram")
  ) {
    return fallback;
  }

  return path;
}
