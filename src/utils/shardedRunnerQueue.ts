import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {DeferredPromise, getDeferredPromise} from './promiseFns';
import {AnyFn} from './types';

export type ShardId = string[];

export interface ShardedInput<TInputItem = unknown, TMeta = unknown> {
  shardId: ShardId;
  input: TInputItem[];
  meta?: TMeta;
}

export interface ShardResult<TOutputItem = unknown> {
  shard: Shard;
  result: PromiseSettledResult<TOutputItem>;
}

export interface Shard<TInputItem = unknown, TOutputItem = unknown, TMeta = unknown> {
  id: ShardId;
  input: TInputItem[];
  promise: DeferredPromise<ShardResult<TOutputItem>>;
  meta: TMeta;
}

export interface ShardRunner<
  TInputItem = unknown,
  TOutputItem = unknown,
  TMeta = unknown,
> {
  name: string;
  match: AnyFn<[ShardId], boolean>;
  runner: AnyFn<[Shard<TInputItem, TOutputItem, TMeta>], Promise<TOutputItem>>;
}

export interface ShardedRunnerIngestAndRunSuccess<
  TInputItem = unknown,
  TOutputItem = unknown,
> {
  input: TInputItem[];
  output: TOutputItem;
}

export interface ShardedRunnerIngestAndRunFailure<TInputItem = unknown> {
  input: TInputItem[];
  reason: unknown;
}

export interface ShardedRunnerIngestAndRunResult<
  TInputItem = unknown,
  TOutputItem = unknown,
> {
  success: Array<ShardedRunnerIngestAndRunSuccess<TInputItem, TOutputItem>>;
  failed: Array<ShardedRunnerIngestAndRunFailure<TInputItem>>;
}

type IngestAndRunIntermediateSortMap = Record<
  string,
  {input: unknown[]; id: ShardId; meta: unknown | undefined}
>;

/**
 * ShardedRunner queues items in a shard, and starts a registered runner if
 * there isn't one running already. Runners acquire (meaning they remove it from
 * the shard store) shards, allowing subsequent queues/ingestions to not have to
 * wait for the current runner to complete. When a runner completes a shard, it
 * tries to acquire another with the same shard ID, and ends if there isn't one.
 * ShardedRunner leverages Node.js' single-threadedness to avoid race
 * conditions.
 * */
export class ShardedRunner {
  protected shards: Record</** stringified shard ID */ string, Shard | undefined> = {};
  protected runners: Record</** shard runner name */ string, ShardRunner | undefined> =
    {};

  registerRunner(runner: ShardRunner) {
    this.runners[runner.name] = runner;
  }

  async ingestAndRun<TInputItem = unknown, TOutputItem = unknown, TMeta = unknown>(
    input: Array<ShardedInput<TInputItem, TMeta>>
  ): Promise<ShardedRunnerIngestAndRunResult<TInputItem, TOutputItem>> {
    const intermediateSortMap: Partial<IngestAndRunIntermediateSortMap> = {};
    const touchedShards: Shard[] = [];

    // sort and group shard items together
    input.forEach(nextInput => {
      const key = this.stringifyShardId(nextInput.shardId);
      let intermediateMap = intermediateSortMap[key];

      if (!intermediateMap) {
        intermediateMap = intermediateSortMap[key] = {
          id: nextInput.shardId,
          input: nextInput.input,
          meta: nextInput.meta,
        };
      } else {
        intermediateMap.input = intermediateMap.input.concat(nextInput.input);
      }
    });

    for (const key in intermediateSortMap) {
      const {
        id,
        meta,
        input: items,
      } = (intermediateSortMap as IngestAndRunIntermediateSortMap)[key];
      let shard = this.shards[key];

      // merge into existing shard or create a new one
      if (shard) {
        shard.input = shard.input.concat(items);
      } else {
        const promise = getDeferredPromise<ShardResult>();
        shard = {id, promise, meta, input: items};
        this.shards[key] = shard;
      }

      // keep track of touched shards to wait for the results. we also don't
      // want to keep track of the entire shard seeing the caller may not own
      // every input in there, which would lead to data leaking
      touchedShards.push(this.produceShardView(items, shard));

      // check if there's an existing runner
      const lockName = this.getLockName(id, key);
      const isRunning = kUtilsInjectables.locks().has(lockName);

      // start a runner if there isn't one already. we don't need to wait for
      // individual runners, seeing they don't handle just a single shard, but a
      // sequence of shards until there's none left. we wait instead for the
      // deferred promise of touched shards
      if (!isRunning) {
        kUtilsInjectables.promises().forget(
          kUtilsInjectables.locks().run(lockName, async () => {
            await this.runShard(id, key);
          })
        );
      }
    }

    const settledResult = await this.waitAndProcessResult(touchedShards);
    return settledResult as ShardedRunnerIngestAndRunResult<TInputItem, TOutputItem>;
  }

  protected async runShard(id: ShardId, key?: string) {
    if (!key) {
      key = this.stringifyShardId(id);
    }

    const shard = this.acquireShard(id, key);
    const runner = this.getRunner(id);

    if (!shard || !runner) {
      return;
    }

    try {
      const result = await runner.runner(shard);
      shard.promise.resolve({shard, result: {status: 'fulfilled', value: result}});
    } catch (error: unknown) {
      shard.promise.resolve({shard, result: {status: 'rejected', reason: error}});
    }

    this.runShard(id, key);
  }

  protected acquireShard(id: ShardId, key?: string) {
    if (!key) {
      key = this.stringifyShardId(id);
    }

    const shard = this.shards[key];
    delete this.shards[key];
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

  protected async waitAndProcessResult(shards: Shard[]) {
    const success: Array<ShardedRunnerIngestAndRunSuccess> = [];
    const failed: Array<ShardedRunnerIngestAndRunFailure> = [];
    const promises = shards.map(shard => shard.promise.promise);
    const results = await Promise.allSettled(promises);

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const {shard, result: shardResult} = result.value;

        if (shardResult.status === 'fulfilled') {
          success.push({output: shardResult.value, input: shard.input});
        } else {
          failed.push({reason: shardResult.reason, input: shard.input});
        }
      } else {
        // should not happen
        kUtilsInjectables.logger().error(result.reason);
      }
    });

    return {success, failed};
  }

  protected produceShardView(input: unknown[], shard: Shard): Shard {
    return {
      input,
      id: shard.id,
      meta: shard.meta,
      promise: shard.promise,
    };
  }
}
