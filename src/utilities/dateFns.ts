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
