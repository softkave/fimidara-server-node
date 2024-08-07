import {SchemaMap} from 'joi';
import {IsNever, UnionToIntersection} from 'type-fest';

/* eslint-disable @typescript-eslint/ban-types */
export interface UpdateItemById<T> {
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
export type AnyFn<Args extends any[] = any[], Result = any> = (
  ...args: Args
) => Result;
export type AnyAsyncFn<Args extends any[] = any[], Result = any> = (
  ...args: Args
) => Promise<Result>;

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
  ...0[],
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

export type EmptyObject = {};
export type ClassConstructor = new (...args: any) => any;
export type AbstractClassConstructor = abstract new (...args: any) => any;

// from express.js type definitions
type RemoveTail<
  S extends string,
  Tail extends string,
> = S extends `${infer P}${Tail}` ? P : S;
type GetRouteParameter<S extends string> = RemoveTail<
  RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
  `.${string}`
>;

export interface ParamsDictionary {
  [key: string]: string;
}

/**
 * Returns route parameters, example:
 * @example
 * ```
 * type P = RouteParameters<"workspace/getWorkspace/:workspaceId">
 * // => {workspaceId: string}
 * ```
 */
export type RouteParameters<Route extends string> = string extends Route
  ? ParamsDictionary
  : Route extends `${string}(${string}`
    ? ParamsDictionary //TODO: handling for regex parameters
    : Route extends `${string}:${infer Rest}`
      ? (GetRouteParameter<Rest> extends never
          ? ParamsDictionary
          : GetRouteParameter<Rest> extends `${infer ParamName}?`
            ? {[P in ParamName]?: string}
            : {[P in GetRouteParameter<Rest>]: string}) &
          (Rest extends `${GetRouteParameter<Rest>}${infer Next}`
            ? RouteParameters<Next>
            : unknown)
      : {};

export type JoiSchemaParts<T> = Required<SchemaMap<T>>;
export type PartialRecord<K extends string | number | symbol, T> = {
  [P in K]?: T;
};

export type GetTypeFromTypeOrArray<T> = T extends Array<infer T1> ? T1 : T;
export type InvertRecord<M> = M extends Record<infer K, infer V>
  ? V extends string | number | symbol
    ? Record<V, K>
    : Record<string, K>
  : never;

export type DefaultTo<
  T,
  TDefault,
  TDefaultFrom = undefined,
> = T extends TDefaultFrom ? TDefault : T;

export type ToPrimitiveJsType<T> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : T extends any[]
        ? 'array'
        : T extends object
          ? 'object'
          : 'any';

export type StringKeysOnly<TData> = keyof TData extends string
  ? keyof TData
  : '';
export type OrArray<TData> = TData | Array<TData>;
export type OrPromise<TData> = TData | Promise<TData>;
export type IsUnion<T> = UnionToIntersection<T> extends never
  ? true
  : IsNever<Exclude<keyof UnionToIntersection<T>, keyof T>> extends true
    ? false
    : true;

/**
 *  type IsUnion<T, U extends T = T> =
      T extends unknown ? [U] extends [T] ? false : true : false;
 */

type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never;

type Push<T extends any[], V> = [...T, V];
export type UnionToTuple<
  T,
  TLast = LastOf<T>,
  TNever = [T] extends [never] ? true : false,
> = true extends TNever ? [] : Push<UnionToTuple<Exclude<T, TLast>>, TLast>;

type TTL<T> = T extends string ? 'string' : T extends null ? 'null' : 'never';

type T1 = UnionToTuple<TTL<string | null>>;

export type IsStringEnum<T> = IsNever<
  IsUnion<T> & (T | string extends string ? true : false)
> extends true
  ? false
  : true;

export type Not<T extends boolean> = T extends true ? false : true;
export type IsBoolean<T> = T extends boolean ? true : false;
