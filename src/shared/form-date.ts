export function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function timeInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }
  return date.toISOString().slice(11, 16);
}

export function dateTimeInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }
  return date.toISOString().slice(0, 16);
}
