import type {Buffer} from 'buffer';
import {DisposableResource, OrArray} from 'softkave-js-utils';

export interface IDSetContext extends DisposableResource {
  add(key: string, value: OrArray<string | Buffer>): Promise<void>;
  delete(key: string, value?: OrArray<string | Buffer>): Promise<void>;
  has(key: string, value?: string | Buffer): Promise<boolean>;
  size(key: string): Promise<number>;
  scan(
    key: string,
    opts: {size?: number; cursor?: number}
  ): Promise<{
    values: Array<string | Buffer>;
    cursor: number;
    done: boolean;
  }>;
  getAll(key: string): Promise<Array<string | Buffer>>;
}
