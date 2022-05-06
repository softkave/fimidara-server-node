import {IUser} from '../definitions/user';

/* eslint-disable @typescript-eslint/ban-types */
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

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[]
];

export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never;
    }[keyof T]
  : '';

export type AnyObject = {[key: string]: any};
