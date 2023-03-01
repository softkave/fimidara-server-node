import {format} from 'date-fns';

export function getDate(initial?: any) {
  if (initial) {
    const date = new Date(initial);
    return date;
  }
  return new Date();
}

export function getTimestamp(initial?: any) {
  if (initial) {
    const date = new Date(initial);
    return date.valueOf();
  }
  return new Date().valueOf();
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
  return format(new Date(date), 'MMM d yyyy');
}

export function formatDateTime(date: number | string | Date) {
  return format(new Date(date), 'MMM d yyyy, H:mm a');
}

export function dateToSeconds(date: string | Date | number) {
  return getDate(date).valueOf() * 1000;
}
