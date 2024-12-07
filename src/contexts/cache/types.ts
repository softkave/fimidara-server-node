import type {Buffer} from 'buffer';
import {DisposableResource} from 'softkave-js-utils';

export interface ICacheContext extends DisposableResource {
  get(key: string): Promise<string | null>;
  getJson<T>(key: string): Promise<T | null>;
  getList(key: string[]): Promise<Array<string | null>>;
  getJsonList<T>(key: string[]): Promise<Array<T | null>>;
  set(
    key: string,
    value: string | Buffer,
    opts?: {
      ttlMs?: number;
    }
  ): Promise<void>;
  setJson<T>(
    key: string,
    value: T,
    opts?: {
      ttlMs?: number;
    }
  ): Promise<void>;
  setList(list: Array<{key: string; value: string | Buffer}>): Promise<void>;
  setJsonList<T>(list: Array<{key: string; value: T}>): Promise<void>;
  delete(key: string | string[]): Promise<void>;
}
