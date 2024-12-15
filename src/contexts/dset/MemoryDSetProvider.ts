import {convertToArray, OrArray} from 'softkave-js-utils';
import {IDSetContext} from './types.js';

export class MemoryDSetProvider implements IDSetContext {
  private dset: Map<string, Set<string | Buffer>>;

  constructor() {
    this.dset = new Map();
  }

  async add(key: string, value: OrArray<string | Buffer>): Promise<void> {
    const values = convertToArray(value);
    const set = this.dset.get(key) ?? new Set();
    values.forEach(value => set.add(value));
    this.dset.set(key, set);
  }

  async delete(key: string, value?: OrArray<string | Buffer>): Promise<void> {
    if (value) {
      const values = convertToArray(value);
      const set = this.dset.get(key);
      if (set) {
        values.forEach(value => set.delete(value));
      }
    } else {
      this.dset.delete(key);
    }
  }

  async has(key: string, value: string | Buffer): Promise<boolean> {
    const set = this.dset.get(key);
    return set?.has(value) ?? false;
  }

  async size(key: string): Promise<number> {
    const set = this.dset.get(key);
    return set?.size ?? 0;
  }

  async scan(
    key: string,
    opts: {cursor?: number; size?: number}
  ): Promise<{values: Array<string | Buffer>; cursor: number; done: boolean}> {
    const {cursor, size} = opts;
    const set = this.dset.get(key);
    if (!set) {
      return {values: [], cursor: 0, done: true};
    }

    const setArr = Array.from(set);
    const start = cursor ?? 0;
    const end = Math.min(setArr.length, start + (size ?? setArr.length));
    const values = setArr.slice(start, end);
    const newCursor = start + values.length;
    const done = newCursor >= setArr.length;
    return {values, done, cursor: done ? 0 : newCursor};
  }

  async getAll(key: string): Promise<Array<string | Buffer>> {
    const set = this.dset.get(key);
    return set ? Array.from(set) : [];
  }
}
