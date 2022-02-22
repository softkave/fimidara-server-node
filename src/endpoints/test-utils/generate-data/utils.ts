import {merge} from 'lodash';

export type GenPartialTestDataFn<T> = (
  index: number,
  indexItem: T,
  cache: Record<string, any>
) => Partial<T>;

export const defaultGenPartialTestDataFn: GenPartialTestDataFn<
  any
> = () => ({});

export function generateTestList<
  T,
  C extends Record<string, any> = Record<string, any>
>(
  genFull: (index: number, cache: Record<string, any>) => T,
  count = 20,
  genPartial: GenPartialTestDataFn<T> = () => ({}),
  cache: C = <any>{}
) {
  const data: T[] = [];
  for (let i = 0; i < count; i++) {
    const f = genFull(i, cache);
    const item = merge(f, genPartial(i, f, cache));
    data.push(item);
  }
  return data;
}
