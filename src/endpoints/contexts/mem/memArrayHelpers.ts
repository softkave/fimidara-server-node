import {last} from 'lodash';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {toNonNullableArray} from '../../../utils/fns';

function makeArrayLike<T>(obj: {
  get(index: number): T;
  set(index: number, value: T): void;
  length: number;
  [K: string | symbol]: any;
}) {
  const proxy = new Proxy(obj, {
    get(target, prop) {
      const i = prop as unknown as number;
      if (i > 0) {
        return target.get(i);
      }
      return target[prop];
    },

    set(target, prop, value: T) {
      const i = prop as unknown as number;
      if (i > 0) {
        target.set(i, value);
      } else {
        target[prop] = value;
      }

      return true;
    },
  });

  return proxy as ArrayLike<T> & typeof proxy;
}

type StackedArraySplitItem = {
  /** For checking if parent has changed since last insertion call. */
  parentLength: number;
};

/**
 * Stacks an array (with view of the parent) on the another, allowing up to 2
 * layers, that is, the parent and the child. It's used by the Memstore
 * timestamp index for creating a separate index for transactions without
 * copying the items of the main index, but still having access to the main
 * index. It also houses mutations to the index that occur during the txn's
 * lifetime, giving subsequent txn calls access to those mutations but keeping
 * the main index separate (i.e those mutations don't leak out of the txn). It
 * also provides a way to merge both indexes when we're ready to commit the txn.
 */
export class StackedArray<T> {
  static from<T>(parent?: StackedArray<T>) {
    return new StackedArray(parent);
  }

  protected splits: Array<StackedArraySplitItem> = [];
  protected arrays: Array<T[]> = [];
  protected ownLength = 0;

  constructor(protected parentRef?: StackedArray<T>) {}

  get length(): number {
    return this.parentRef ? this.parentRef.length + this.ownLength : this.ownLength;
  }

  push(item: T | T[]) {
    const items = toNonNullableArray(item ?? []);
    const parentLength = this.parentRef ? this.parentRef.length : 0;
    const split = last(this.splits);

    // Check whether parent has changed and if it hasn't push into own array
    // without pushing a new split
    if (split && parentLength === split.parentLength) {
      this.pushIntoOwnArray(items, this.splits.length - 1);
    } else {
      this.splits.push({parentLength});
      this.pushIntoOwnArray(items, this.splits.length - 1);
    }
  }

  getLast(): T | undefined {
    const split = last(this.splits);
    const parentLength = this.parentRef ? this.parentRef.length : 0;
    if (split && split.parentLength === parentLength) {
      const array = last(this.arrays) ?? [];
      return last(array);
    }

    if (this.parentRef) {
      return this.parentRef.getLast();
    }

    return undefined;
  }

  release() {
    const splits = this.splits,
      arrays = this.arrays,
      ownLength = this.ownLength;
    this.splits = [];
    this.arrays = [];
    this.ownLength = 0;
    return {splits, arrays, ownLength};
  }

  merge(source: StackedArray<T>) {
    appAssert(
      !this.parentRef,
      new ServerError(),
      'merging into instances that have a base is not supported.'
    );
    const {splits, arrays, ownLength} = source.release();
    appAssert(splits.length === arrays.length);
    splits.forEach((split, index) => {
      this.arrays.splice(split.parentLength - 1, 0, arrays[index]);
    });
    this.ownLength += ownLength;
  }

  some(fn: (nextItem: T, index: number) => boolean): boolean {
    let matched = false;
    let index = 0;

    for (let i = 0; i < this.splits.length; i++) {
      const split = this.splits[i];
      if (split.parentLength && this.parentRef) {
        matched = this.parentRef.some(item => fn(item, index++));
      }

      if (matched) return matched;

      const array = this.arrays[i] ?? [];
      matched = array.some(item => fn(item, index++));

      if (matched) return matched;
    }

    return false;
  }

  inplaceFilter(fn: (stack: T[]) => {stack: T[]; stop?: boolean}) {
    for (let i = 0; i < this.arrays.length; i++) {
      const {stack, stop} = fn(this.arrays[i]);
      this.arrays[i] = stack;
      if (stop) break;
    }

    if (this.parentRef) this.parentRef.inplaceFilter(fn);
  }

  protected pushIntoOwnArray(items: T[], index: number) {
    const array = this.arrays[index];

    if (array) {
      this.arrays[index] = array.concat(items);
    } else {
      this.arrays.push(items);
    }

    this.ownLength += items.length;
  }
}
