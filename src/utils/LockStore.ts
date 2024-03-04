import {first, noop} from 'lodash';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {ListenableResource} from './ListenableResource';
import {getNewId} from './resource';
import {AnyFn, ObjectValues, OrPromise, PartialRecord} from './types';

const kLockQueueItemState = {
  waiting: 'waiting',
  waitingOnResolve: 'waitingOnResolve',
} as const;

type LockQueueItemState = ObjectValues<typeof kLockQueueItemState>;

interface LockQueueItem {
  state: LockQueueItemState;
  resolveFn: AnyFn;
}

export class LockStore {
  protected locks: PartialRecord<string, ListenableResource<LockQueueItem>[]> = {};

  async run(name: string, fn: AnyFn) {
    await this.acquire(name);

    try {
      return await fn();
    } finally {
      this.release(name);
    }
  }

  has(name: string) {
    return !!this.getLockQueue(name, false)?.length;
  }

  protected acquire(name: string) {
    const queue = this.getLockQueue(name, true);
    const item = new ListenableResource<LockQueueItem>({
      state: kLockQueueItemState.waitingOnResolve,
      resolveFn: noop,
    });

    queue.push(item);
    const p = new Promise<void>(resolve => {
      item.set({
        state: kLockQueueItemState.waiting,
        resolveFn: resolve,
      });
    });

    setTimeout(() => this.execNext(name), 0);
    return p;
  }

  protected release(name: string) {
    const queue = this.getLockQueue(name, true);
    queue.shift();
    this.execNext(name);
  }

  protected execNext = (name: string) => {
    const queue = this.getLockQueue(name, true);
    const next = first(queue);
    const item = next?.get();

    if (!next || !item) {
      return;
    }

    if (item.state === kLockQueueItemState.waitingOnResolve) {
      next.listen(this.execLockItem);
    }

    this.execLockItem(item);
  };

  protected execLockItem = (item?: LockQueueItem) => {
    if (item?.state === kLockQueueItemState.waiting) {
      item.resolveFn();
      return true;
    }

    return false;
  };

  protected getLockQueue<
    TInitQueue extends boolean = true,
    TResult = TInitQueue extends true
      ? ListenableResource<LockQueueItem>[]
      : ListenableResource<LockQueueItem>[] | undefined,
  >(name: string, init: TInitQueue): TResult {
    let queue = this.locks[name];

    if (!queue && init) {
      queue = this.locks[name] = [];
    }

    return queue as TResult;
  }
}

export class LockableResource<T> {
  protected resource: T;
  protected name: string;

  constructor(resource: T, name = getNewId()) {
    this.resource = resource;
    this.name = name;
  }

  async run(fn: AnyFn<[T], OrPromise<T | void>>) {
    await kUtilsInjectables.locks().run(this.name, async () => {
      const newData = await fn(this.resource);

      if (newData) {
        this.resource = newData;
      }
    });
  }
}

interface SingleInstanceRunnerMakeOptions<TFn extends AnyFn> {
  instanceSpecifier: (...args: Parameters<TFn>) => string;
  fn: TFn;
}

export class SingleInstanceRunner {
  static make<TFn extends AnyFn>(opts: SingleInstanceRunnerMakeOptions<TFn>) {
    return async (...args: Parameters<TFn>): Promise<Awaited<ReturnType<TFn>>> => {
      const id = opts.instanceSpecifier(...args);
      return await kUtilsInjectables.locks().run(id, () => opts.fn(...args));
    };
  }
}
