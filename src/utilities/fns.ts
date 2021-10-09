export default function cast<ToType>(resource: any): ToType {
  return (resource as unknown) as ToType;
}
