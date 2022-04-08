import {format} from 'date-fns';

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
    return date.toUTCString();
  }

  return new Date().toUTCString();
}

export function getDateStringIfPresent(initial?: any) {
  if (initial) {
    const date = new Date(initial);
    return date.toUTCString();
  }

  return undefined;
}

export function formatDate(date: number | string | Date) {
  return format(new Date(date), 'MMM d yyyy');
}

export function formatDateTime(date: number | string | Date) {
  return format(new Date(date), 'MMM d yyyy, H:mm a');
}
