import format from 'date-fns/format';

export function getDate(initial?: any) {
  if (initial) {
    const date = new Date(initial);
    return date;
  }

  return new Date();
}

export function getDateString(initial?: any) {
  if (initial) {
    const date = new Date(initial);
    return date.toISOString();
  }

  return new Date().toISOString();
}

export function getDateStringIfPresent(initial?: any) {
  if (initial) {
    const date = new Date(initial);
    return date.toISOString();
  }

  return undefined;
}

export function formatDate(date: number | string | Date) {
  return format(new Date(date), 'MMM d YYY');
}
