export default function cast<ToType>(resource: any): ToType {
  return (resource as unknown) as ToType;
}

export function isObjectEmpty(data: Record<string | number, any>) {
  return Object.keys(data).length === 0;
}

export function denull<T>(item: T | null) {
  return item === null ? undefined : item;
}
