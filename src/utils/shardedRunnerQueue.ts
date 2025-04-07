import {compact, last, uniqWith} from 'lodash-es';
import {AnyFn, OmitFrom} from 'softkave-js-utils';
import {ValueOf} from 'type-fest';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {DeferredPromise, getDeferredPromise} from './promiseFns.js';

/** shard ID is case-sensitive, so `["shard-01"] !== ["SHARD-01"]` */
export type ShardId = string[];

export const kShardQueueStrategy = {
  /** add new shards input to the last existing shard, if there're existing
   * shards. otherwise creates a new shard */
  appendToExisting: 'appendToExisting',
  /** adds new shard, whether there're existing shards or not */
  separateFromExisting: 'separateFromExisting',
} as const;

export const kShardMatchStrategy = {
  /** shard ID is treated as a whole */
  individual: 'individual',
  /** match closest shard matching part of shard ID, or create one if none is
   * found */
  hierachichal: 'hierachichal',
} as const;

export type ShardQueueStrategy = ValueOf<typeof kShardQueueStrategy>;
export type ShardMatchStrategy = ValueOf<typeof kShardMatchStrategy>;
export type ShardDoneFn = AnyFn<[], Promise<void>>;

export interface ShardedInput<TInputItem = unknown, TMeta = unknown> {
  shardId: ShardId;
  input: TInputItem;
  /** shard-unique meta, i.e. for 2 shards s1 and s2 with the same shardId,
   * s1.meta must be equal to s2.meta */
  meta?: TMeta;
  queueStrategy: ShardQueueStrategy;
  matchStrategy: ShardMatchStrategy;
  done: ShardDoneFn;
}

export interface ShardResult<TPerInputOutputItem = unknown> {
  shard: Shard;
  result: PromiseSettledResult<ShardedRunnerOutput<TPerInputOutputItem>>;
}

export interface Shard<
  TInputItem = unknown,
  TPerInputOutputItem = unknown,
  TMeta = unknown,
> {
  id: ShardId;
  shardInputList: Array<ShardedInput<TInputItem>>;
  promise: DeferredPromise<ShardResult<TPerInputOutputItem>>;
  /** shard-unique meta, i.e. for 2 shards s1 and s2 with the same shardId,
   * s1.meta must be equal to s2.meta */
  meta: TMeta;
  doneFns: ShardDoneFn[];
}

interface ShardView extends OmitFrom<Shard, 'doneFns' | 'shardInputList'> {
  shardInput: ShardedInput;
}

export interface ShardedRunnerOutputPerInput<TPerInputOutputItem = unknown> {
  shardInput: ShardedInput;
  output:
    | {success: true; item: TPerInputOutputItem}
    | {success: false; reason: unknown};
}

export type ShardedRunnerOutput<TPerInputOutputItem = unknown> = Map<
  ShardedInput,
  ShardedRunnerOutputPerInput<TPerInputOutputItem>
>;

export interface ShardRunner<
  TInputItem = unknown,
  TPerInputOutputItem = unknown,
  TMeta = unknown,
> {
  name: string;
  match: AnyFn<[ShardId], boolean>;
  runner: AnyFn<
    [Shard<TInputItem, TPerInputOutputItem, TMeta>],
    Promise<ShardedRunnerOutput<TPerInputOutputItem>>
  >;
}

export interface ShardedRunnerIngestAndRunSuccess<
  TInputItem = unknown,
  TPerInputOutputItem = unknown,
> {
  input: TInputItem;
  output: TPerInputOutputItem;
}

export interface ShardedRunnerIngestAndRunFailure<TInputItem = unknown> {
  input: TInputItem;
  reason: unknown;
}

export interface ShardedRunnerIngestAndRunResult<
  TInputItem = unknown,
  TPerInputOutputItem = unknown,
> {
  success: Array<
    ShardedRunnerIngestAndRunSuccess<TInputItem, TPerInputOutputItem>
  >;
  failed: Array<ShardedRunnerIngestAndRunFailure<TInputItem>>;
}

/**
 * ShardedRunner queues items in a shard, and starts a runner if there isn't
 * one. Runners acquire (meaning they remove from the shard store) shards,
 * allowing subsequent queues/ingestions to not have to wait for the current
 * runner to complete. When a runner completes a shard, it tries to acquire
 * another with the same shard ID, and ends if there isn't one. ShardedRunner
 * leverages Node.js' single-threadedness to avoid race conditions.
 * */
export class ShardedRunner {
  protected shards: Record<
    /** stringified shard ID */ string,
    Shard[] | undefined
  > = {};
  protected runners: Record<
    /** shard runner name */ string,
    ShardRunner | undefined
  > = {};

  registerRunner(runner: ShardRunner) {
    this.runners[runner.name] = runner;
  }

  async ingestAndRun<
    TInputItem = unknown,
    TPerInputOutputItem = unknown,
    TMeta = unknown,
  >(
    input: Array<ShardedInput<TInputItem, TMeta>>
  ): Promise<ShardedRunnerIngestAndRunResult<TInputItem, TPerInputOutputItem>> {
    const inputShards = input.map(nextInput => {
      const key = this.stringifyShardId(nextInput.shardId);
      const queuedShard = this.queueShard(key, nextInput);

      // keep track of touched shards to wait for the results. we also don't
      // want to keep track of the entire shard seeing the caller may not own
      // every input in there, which would lead to data leaking
      const shardView = this.produceShardView(nextInput, queuedShard);
      return [key, shardView] as const;
    });

    // run unique shards
    uniqWith(inputShards, ([key01], [key02]) => key01 === key02).forEach(
      ([key, {id}]) => {
        // check if there's an existing runner
        const lockName = this.getLockName(id, key);
        const isRunning = kIjxUtils.locks().has(lockName);

        // start a runner if there isn't one already. we don't need to wait for
        // individual runners, seeing they don't handle just a single shard, but a
        // sequence of shards until there's none left. we wait instead for the
        // deferred promise of touched shards
        if (!isRunning) {
          kIjxUtils.promises().callAndForget(() =>
            kIjxUtils.locks().run(lockName, async () => {
              await this.runShard(id, key);
            })
          );
        }
      }
    );

    const settled = await this.waitAndProcessResult(
      inputShards.map(([, shard]) => shard)
    );

    return settled as ShardedRunnerIngestAndRunResult<
      TInputItem,
      TPerInputOutputItem
    >;
  }

  protected async runShard(id: ShardId, key?: string) {
    if (!key) {
      key = this.stringifyShardId(id);
    }

    const shard = this.dequeueShard(id, key);
    const runner = this.getRunner(id);

    if (!shard || !runner) {
      return;
    }

    try {
      const result = await runner.runner(shard);
      shard.promise.resolve({
        shard,
        result: {status: 'fulfilled', value: result},
      });
      await Promise.allSettled(shard.doneFns.map(doneFn => doneFn()));
    } catch (error: unknown) {
      shard.promise.resolve({
        shard,
        result: {status: 'rejected', reason: error},
      });
    }

    await this.runShard(id, key);
  }

  protected dequeueShard(id: ShardId, key?: string) {
    if (!key) {
      key = this.stringifyShardId(id);
    }

    const shards = this.shards[key] || [];
    const shard = shards.shift();

    if (shards.length === 0) {
      delete this.shards[key];
    }

    return shard;
  }

  protected queueShard(key: string, input: ShardedInput) {
    let shards: Shard[] | undefined;

    if (input.matchStrategy === kShardMatchStrategy.individual) {
      shards = this.shards[key];
    } else if (input.matchStrategy === kShardMatchStrategy.hierachichal) {
      shards = last(
        compact(
          input.shardId.map((idPart, index) => {
            const key = this.stringifyShardId(
              input.shardId.slice(0, index + 1)
            );
            return this.shards[key];
          })
        )
      );
    }

    if (!shards) {
      shards = this.shards[key] = [];
    }

    let shard = last(shards);

    if (input.queueStrategy === kShardQueueStrategy.appendToExisting && shard) {
      shard.shardInputList = shard.shardInputList.concat(input);
      shard.doneFns.push(input.done);
    } else {
      const promise = getDeferredPromise<ShardResult>();
      shard = {
        promise,
        doneFns: [input.done],
        id: input.shardId,
        meta: input.meta,
        shardInputList: [input],
      };
      shards.push(shard);
    }

    return shard;
  }

  protected stringifyShardId(id: ShardId) {
    return id.join('.');
  }

  protected getLockName(id: ShardId, key?: string) {
    if (!key) {
      key = this.stringifyShardId(id);
    }

    return `shardedRunner_${key}`;
  }

  protected getRunner(id: ShardId) {
    // TODO: can we find runner faster?
    for (const name in this.runners) {
      const runner = this.runners[name];
      const isMatched = runner?.match(id);

      if (isMatched) {
        return runner;
      }
    }

    return undefined;
  }

  protected async waitAndProcessResult(shards: ShardView[]) {
    const success: Array<ShardedRunnerIngestAndRunSuccess> = [];
    const failed: Array<ShardedRunnerIngestAndRunFailure> = [];
    const results = await Promise.allSettled(
      shards.map(async shard => [shard, await shard.promise.promise] as const)
    );

    results.forEach(result => {
      if (result.status !== 'fulfilled') {
        // should not happen
        kIjxUtils.logger().error(result.reason);
        return;
      }

      const [shard, {result: shardResult}] = result.value;
      const input = shard.shardInput.input;

      if (shardResult.status === 'fulfilled') {
        const output = shardResult.value.get(shard.shardInput)?.output;

        if (output?.success) {
          success.push({input, output: output.item});
        } else {
          failed.push({input, reason: output?.reason});
        }
      } else {
        failed.push({input, reason: shardResult.reason});
      }
    });

    return {success, failed};
  }

  protected produceShardView(
    input: ShardedInput,
    shard: OmitFrom<Shard, 'doneFns'>
  ): ShardView {
    return {
      shardInput: input,
      promise: shard.promise,
      meta: shard.meta,
      id: shard.id,
    };
  }
}

export function makeShardDoneFn() {
  const promise = getDeferredPromise();
  const done: ShardDoneFn = () => {
    return promise.promise;
  };

  return {done, promise};
}
