import {last} from 'lodash';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {toArray} from '../../../utils/fns';

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

export class StackedArray<T> {
  static from<T>(parent?: StackedArray<T>) {
    return new StackedArray(parent);
  }

  protected splits: Array<{
    parentLength: number;
    ownIndex: number;
  }> = [];
  protected arrays: Array<T[]> = [];
  protected ownLength = 0;

  constructor(protected parentRef?: StackedArray<T>) {}

  get length(): number {
    return this.parentRef ? this.parentRef.length + this.ownLength : this.ownLength;
  }

  push(item: T | T[]) {
    const items = toArray(item ?? []);

    if (this.parentRef) {
      const split = last(this.splits);

      if (split && this.parentRef.length === split.parentLength) {
        this.pushIntoOwnArray(items);
      } else {
        this.pushIntoOwnArray(items);
        this.splits.push({
          ownIndex: this.arrays.length,
          parentLength: this.parentRef.length,
        });
      }
    } else {
      this.pushIntoOwnArray(items);
    }
  }

  getLast(): T | undefined {
    const split = last(this.splits);
    if (split && split.parentLength === this.parentRef!.length) {
      const array = this.arrays[split.ownIndex];
      if (array) return last(array);
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
    splits.forEach(split => {
      this.arrays.splice(split.parentLength - 1, 0, arrays[split.ownIndex]);
    });
    this.ownLength += ownLength;
  }

  some(fn: (nextItem: T, index: number) => boolean): boolean {
    let matched = false;
    let index = 0;

    for (const split of this.splits) {
      if (split.parentLength && this.parentRef) {
        matched = this.parentRef.some(item => fn(item, index++));
      }

      if (matched) return matched;

      const array = this.arrays[split.ownIndex] ?? [];
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

  protected pushIntoOwnArray(items: T[]) {
    const lastArray = last(this.arrays);
    if (lastArray) {
      this.arrays[this.arrays.length - 1] = lastArray.concat(items);
    } else {
      this.arrays.push(items);
    }

    this.ownLength += items.length;
  }
}
