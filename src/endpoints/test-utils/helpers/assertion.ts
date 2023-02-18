import {indexArray} from '../../../utils/indexArray';

export function expectContainsEveryItemInForAnyType<T2, T1>(
  list1: T1[],
  list2: T2[],
  indexer01: (item: T1) => string,
  indexer02: (item: T2) => string
) {
  const list1Map = indexArray(list1, {indexer: indexer01});
  list2.forEach(item1 => {
    const k = indexer02(item1);
    const item2 = list1Map[k];
    expect(item2).toBeTruthy();
  });
}

/**
 * Checks that `list1` contains every item in `list2` using the `indexer`
 * provided. The `indexer` should return a unique string for each unique item in
 * the list. Also, the same unique string should be returned for the same item
 * no matter how many times `indexer` is called.
 */
export function expectContainsEveryItemIn<T2, T1 extends T2>(
  list1: T1[],
  list2: T2[],
  indexer: (item: T2) => string
) {
  expectContainsEveryItemInForAnyType(list1, list2, indexer, indexer);
}

export function expectContainsNoneInForAnyType<T2, T1>(
  list1: T1[],
  list2: T2[],
  indexer01: (item: T1) => string,
  indexer02: (item: T2) => string
) {
  const list1Map = indexArray(list1, {indexer: indexer01});
  list2.forEach(item1 => {
    const k = indexer02(item1);
    const item2 = list1Map[k];
    expect(item2).toBeFalsy();
  });
}

/**
 * Checks that `list1` contains none of the items in `list2` using the `indexer`
 * provided. The `indexer` should return a unique string for each unique item in
 * the list. Also, the same unique string should be returned for the same item
 * no matter how many times `indexer` is called.
 */
export function expectContainsNoneIn<T2, T1 extends T2>(
  list1: T1[],
  list2: T2[],
  indexer: (item: T2) => string
) {
  expectContainsNoneInForAnyType(list1, list2, indexer, indexer);
}

export function expectContainsExactlyForAnyType<T2, T1>(
  list1: T1[],
  list2: T2[],
  indexer01: (item: T1) => string,
  indexer02: (item: T2) => string
) {
  expect(list1.length).toEqual(list2.length);
  expectContainsEveryItemInForAnyType(list1, list2, indexer01, indexer02);
}

/**
 * Checks that `list1` and `list2` contains the same items using the
 * `indexer` provided. The `indexer` should return a unique string for each
 * unique item in the list. Also, the same unique string should be returned for
 * the same item no matter how many times `indexer` is called.
 */
export function expectContainsExactly<T2, T1 extends T2>(
  list1: T1[],
  list2: T2[],
  indexer: (item: T2) => string
) {
  expectContainsExactlyForAnyType(list1, list2, indexer, indexer);
}
