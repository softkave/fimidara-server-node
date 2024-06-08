import {expect} from 'vitest';
import {indexArray} from '../../../utils/indexArray.js';

export function expectContainsEveryItemInForAnyType<T2, T1>(
  received: T1[],
  expected: T2[],
  receivedIndexer: (item: T1) => string,
  expectedIndexer: (item: T2) => string
) {
  const receivedMap = indexArray(received, {indexer: receivedIndexer});
  expected.forEach(item1 => {
    const k = expectedIndexer(item1);
    const item2 = receivedMap[k];
    expect(item2).toBeTruthy();
  });
}

/**
 * Checks that `received` contains every item in `expected` using the `indexer`
 * provided. The `indexer` should return a unique string for each unique item in
 * the list. Also, the same unique string should be returned for the same item
 * no matter how many times `indexer` is called.
 */
export function expectContainsEveryItemIn<T2, T1 extends T2>(
  received: T1[],
  expected: T2[],
  indexer: (item: T2) => string
) {
  expectContainsEveryItemInForAnyType(received, expected, indexer, indexer);
}

export function expectContainsNoneInForAnyType<T2, T1>(
  received: T1[],
  expected: T2[],
  receivedIndexer: (item: T1) => string,
  expectedIndexer: (item: T2) => string
) {
  const receivedMap = indexArray(received, {indexer: receivedIndexer});
  expected.forEach(item1 => {
    const k = expectedIndexer(item1);
    const item2 = receivedMap[k];
    expect(item2).toBeFalsy();
  });
}

/**
 * Checks that `received` contains none of the items in `expected` using the `indexer`
 * provided. The `indexer` should return a unique string for each unique item in
 * the list. Also, the same unique string should be returned for the same item
 * no matter how many times `indexer` is called.
 */
export function expectContainsNoneIn<T2, T1 extends T2>(
  received: T1[],
  expected: T2[],
  indexer: (item: T2) => string
) {
  expectContainsNoneInForAnyType(received, expected, indexer, indexer);
}

export function expectContainsExactlyForAnyType<T2, T1>(
  received: T1[],
  expected: T2[],
  receivedIndexer: (item: T1) => string,
  expectedIndexer: (item: T2) => string
) {
  expect(received.length).toEqual(expected.length);
  expectContainsEveryItemInForAnyType(
    received,
    expected,
    receivedIndexer,
    expectedIndexer
  );
}

/**
 * Checks that `received` and `expected` contains the same items using the
 * `indexer` provided. The `indexer` should return a unique string for each
 * unique item in the list. Also, the same unique string should be returned for
 * the same item no matter how many times `indexer` is called.
 */
export function expectContainsExactly<T2, T1 extends T2>(
  received: T1[],
  expected: T2[],
  indexer: (item: T2) => string
) {
  expectContainsExactlyForAnyType(received, expected, indexer, indexer);
}

export function expectListSubsetMatch(list01: unknown[], list02: unknown[]) {
  const subsetLength = Math.min(list01.length, list02.length);
  return expect(list01.slice(0, subsetLength)).toEqual(
    list02.slice(0, subsetLength)
  );
}
