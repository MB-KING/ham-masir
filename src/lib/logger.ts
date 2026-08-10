type LogFields = Record<string, string | number | boolean | null | undefined>;

function clean(fields: LogFields = {}) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

export const logger = {
  info(message: string, fields?: LogFields) {
    console.info(JSON.stringify({ level: "info", message, ...clean(fields) }));
  },
  warn(message: string, fields?: LogFields) {
    console.warn(JSON.stringify({ level: "warn", message, ...clean(fields) }));
  },
  error(message: string, fields?: LogFields) {
    console.error(JSON.stringify({ level: "error", message, ...clean(fields) }));
  }
};
