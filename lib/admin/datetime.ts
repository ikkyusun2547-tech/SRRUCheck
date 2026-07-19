// SRRU operates on Thailand local time (UTC+7). <input type="datetime-local">
// gives a timezone-less "YYYY-MM-DDTHH:mm" string — naively passing that to
// `new Date()` interprets it in the *server's* timezone (UTC on most
// deployments), silently shifting every activity time by 7 hours. These
// helpers pin the conversion to +07:00 explicitly, both ways.

export function parseThaiLocalDateTime(value: string): Date {
  const normalized = value.length === 16 ? `${value}:00` : value; // ensure seconds present
  return new Date(`${normalized}+07:00`);
}

export function toThaiDatetimeLocalValue(date: Date): string {
  const thaiMs = date.getTime() + 7 * 60 * 60 * 1000;
  return new Date(thaiMs).toISOString().slice(0, 16);
}
