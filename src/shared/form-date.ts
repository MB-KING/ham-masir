export function dateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function timeInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function dateTimeInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }
  return `${dateInputValue(date)}T${timeInputValue(date)}`;
}
