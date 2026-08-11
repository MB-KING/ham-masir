import {
  tehranDateInputValue,
  tehranTimeInputValue
} from "@/lib/tehran-time";

/** YYYY-MM-DD in Asia/Tehran for date inputs. */
export function dateInputValue(date: Date) {
  return tehranDateInputValue(date);
}

/** HH:mm in Asia/Tehran for time inputs. */
export function timeInputValue(date?: Date | null) {
  return tehranTimeInputValue(date);
}

export function dateTimeInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }
  return `${dateInputValue(date)}T${timeInputValue(date)}`;
}
