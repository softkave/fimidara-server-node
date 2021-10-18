export interface IUpdateItemById<T> {
  id: string;
  data: Partial<T>;
}

export type ConvertTypeOneToTypeTwo<T extends object, One, Two> = {
  [Key in keyof T]: T[Key] extends One
    ? Two
    : T[Key] extends any[]
    ? T[Key][0] extends One
      ? Two
      : T[Key][0] extends object
      ? ConvertTypeOneToTypeTwo<T[Key][0], One, Two>
      : T[Key][0]
    : T[Key] extends object
    ? ConvertTypeOneToTypeTwo<T[Key], One, Two>
    : T[Key];
};

export type ConvertDatesToStrings<T extends object> = ConvertTypeOneToTypeTwo<
  T,
  Date,
  string
>;

export type AnyFn = (...args: any) => any;

export type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

export type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;
