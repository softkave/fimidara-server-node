export default function cast<ToType>(resource: any): ToType {
  return (resource as unknown) as ToType;
}

export function isObjectEmpty(data: Record<string | number, any>) {
  return Object.keys(data).length === 0;
}

export function removeNull<T>(item: T | null) {
  return item === null ? undefined : item;
}

export function getFirstArg<T extends any[]>(...args: T): T[0] {
  return args[0];
}

export async function noopAsync(...args: any) {}

export function applyMixins(derivedConstructors: any, baseConstructors: any[]) {
  baseConstructors.forEach(baseConstructor => {
    Object.getOwnPropertyNames(baseConstructor.prototype).forEach(name => {
      if (name !== 'constructor') {
        derivedConstructors.prototype[name] = baseConstructor.prototype[name];
      }
    });
  });
}

export function applyMixins02<C1, C2>(
  derivedConstructors: C1,
  baseConstructors: [C2]
): C1 & C2 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins03<C1, C2, C3>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3]
): C1 & C2 & C3 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins04<C1, C2, C3, C4>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3, C4]
): C1 & C2 & C3 & C4 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}
