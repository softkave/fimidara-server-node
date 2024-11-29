import {DisposableResource} from 'softkave-js-utils';

export interface IAcquireLockOptions {
  retryCount?: number;
}

export interface IRedlockContext extends DisposableResource {
  using<T>(
    key: string,
    duration: number,
    fn: (signal: AbortSignal) => Promise<T>,
    options?: IAcquireLockOptions
  ): Promise<T>;
}