import {ReadonlyDeep} from 'type-fest';
import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';
import {AppShard, kAppPresetShards, kAppType} from '../../definitions/app';
import {kAppResourceType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {TimeoutError} from '../../utils/errors';
import {callAfterAsync} from '../../utils/fns';
import {getNewId, getNewIdForResource} from '../../utils/resource';
import {AnyFn, AnyObject} from '../../utils/types';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {
  BaseRunnerMessage,
  ChildRunnerWorkerData,
  RunnerWorkerMessage,
  kRunnerWorkerMessageType,
} from './types';
import {
  getNextJob,
  insertRunnerInDB,
  isBaseWorkerMessage,
  isChildRunnerWorkerData,
  isRunnerWorkerMessage,
  kDefaultActiveRunnerHeartbeatFactor,
  kDefaultHeartbeatInterval,
  kDefaultRunnerCount,
  kEnsureRunnerCountPromiseName,
  runJob,
} from './utils';

const workers: Record<string, Worker> = {};

/** Heartbeat is used to let other runners know a certain runner is still alive.
 * Each runner has an entry in DB under `app` table, and for each heartbeat, we
 * update it's `lastUpdatedAt` time. Active runners know other active runners
 * using an agreed upon heartbeat interval and deadness factor, see below. For
 * our worker configuration, we have a main thread we expect to never be blocked
 * (this may not always be the case seeing for now, the main thread is also the
 * main server thread), and the main thread updates the heartbeat of it's worker
 * children. */
let heartbeatInterval = kDefaultHeartbeatInterval;

/** Heartbeat factor or deadness factor represents how long ago a runner's
 * heartbeat has to be to be considered dead or alive. There should be consensus
 * on this from each instance of fimidara. Heartbeat factor is multiplied with
 * `heartbeatInterval` and runners who haven't been updated since then are
 * considered dead. Heartbeat factor should be a non-zero positive integer. */
let activeRunnerHeartbeatFactor = kDefaultActiveRunnerHeartbeatFactor;

/** A list of active runners. We do not fetch unfinished jobs currently being
 * run by these runners. */
let activeRunnerIds: string[] = [];

/** How many runners should we have on this instance. */
let runnerCount = kDefaultRunnerCount;

/** Heartbeat interval NodeJS handle. */
let recordHeartbeatIntervalHandle: NodeJS.Timeout | undefined = undefined;

/** Shards to pick jobs from. Job sharding allow us to discriminate and pick
 * only from a subset of jobs. A primary advantage of this is not picking stale
 * jobs from tests. */
let pickFromShards: Array<string | number> = [kAppPresetShards.fimidaraMain];

/** On which shard should we register our runners in DB. */
let shard: AppShard = kAppPresetShards.fimidaraMain;

/** Represents a list of message handlers to fan incoming messages to. Different
 * for parent, and worker threads. */
const messageHandlers: Map<AnyFn, AnyFn<[unknown]>> = new Map();

function registerMessageHandler(handler: AnyFn<[unknown]>) {
  messageHandlers.set(handler, handler);
}

function unregisterMessageHandler(handler: AnyFn<[unknown]>) {
  messageHandlers.delete(handler);
}

/** Returns `null` for main thread, and `runnerId` for worker threads. */
function tryGetRunnerId() {
  return isMainThread ? null : getWorkerData().runnerId;
}

export async function messageRunner<TMessage extends AnyObject = AnyObject>(
  port: Pick<Worker, 'postMessage'> | undefined | null,
  message: Omit<TMessage, keyof BaseRunnerMessage>,
  /** If true, waits until message is ack-ed before resolving. Otherwise resolve
   * once message is posted. */
  expectAck = false,
  /** How long to wait for ack message. Always supply a timeout, if the default
   * does not work for you. */
  ackTimeoutMs: number = 5_000 // 5 secs
) {
  return new Promise<unknown>((resolve, reject) => {
    if (port) {
      const newMessage: BaseRunnerMessage & AnyObject = {
        messageId: getNewId(),
        runnerId: tryGetRunnerId(),
        ...message,
      };
      const ackFn = (ackMessage: unknown) => {
        if (!isBaseWorkerMessage(ackMessage)) {
          return;
        }

        if (ackMessage.messageId === newMessage.messageId) {
          // We have ack message, cleanup, and resolve
          unregisterMessageHandler(ackFn);
          resolve(ackMessage);
        }
      };

      if (expectAck) {
        // Register handler to filter through incoming message for ack
        registerMessageHandler(ackFn);

        if (ackTimeoutMs) {
          setTimeout(() => {
            // Wait timeout, cleanup and reject
            unregisterMessageHandler(ackFn);
            reject(new TimeoutError());
          }, ackTimeoutMs);
        }
      }

      port.postMessage(newMessage);

      if (!expectAck) {
        // Resolve early if we are not expecting ack
        resolve(undefined);
      }
    } else {
      // Resolve early if there is no port
      resolve(undefined);
    }
  });
}

function handleMessage(message: unknown) {
  messageHandlers.forEach(handler => {
    handler(message);
  });
}

function wrapWorkerHandler(
  handler: AnyFn<[ChildRunnerWorkerData, ...unknown[]]>,
  runnerData: ChildRunnerWorkerData
) {
  return (...args: unknown[]) => handler(runnerData, ...args);
}

function getWorker(id: string) {
  const worker = workers[id];
  appAssert(worker);
  return worker;
}

async function handleRunnerOnline(runnerData: ChildRunnerWorkerData) {
  const worker = getWorker(runnerData.runnerId);

  try {
    await insertRunnerInDB({shard, resourceId: runnerData.runnerId});
    workers[runnerData.runnerId] = worker;
    activeRunnerIds.push(runnerData.runnerId);
  } catch (error) {
    console.error(error);
    await worker.terminate();

    // TODO: ensure runners count?
  }
}

function handleRunnerMessage(message: unknown) {
  if (!isRunnerWorkerMessage(message)) {
    return;
  }

  let ackMessage: BaseRunnerMessage | undefined = {
    messageId: message.messageId,
    runnerId: tryGetRunnerId(),
  };

  // Not all message types are handled here, like `setActiveRunnerIds`, some are
  // handled by specialized functions that call for them as ack messages and use
  // them
  switch (message.type) {
    case kRunnerWorkerMessageType.getActiveRunnerIds: {
      const response: RunnerWorkerMessage = {
        ...ackMessage,
        type: kRunnerWorkerMessageType.setActiveRunnerIds,
        activeRunnerIds: activeRunnerIds,
      };
      ackMessage = response;
      break;
    }

    case kRunnerWorkerMessageType.fail: {
      throw new Error('Planned fail!');
    }

    case kRunnerWorkerMessageType.ack: {
      // We do not need to ack an ack message. Also, to prevent infinite acking!
      ackMessage = undefined;
    }
  }

  if (ackMessage) {
    const port = message.runnerId ? getWorker(message.runnerId) : parentPort;
    messageRunner(port, ackMessage, /** expectAck */ false);
  }
}

function handleRunnerError(runnerData: ChildRunnerWorkerData) {
  removeExistingRunner(runnerData.runnerId);
  ensureRunnerCount();
}

function handleRunnerExit(runnerData: ChildRunnerWorkerData) {
  removeExistingRunner(runnerData.runnerId);
}

function removeExistingRunner(id: string) {
  delete workers[id];
  activeRunnerIds = activeRunnerIds.filter(nextId => nextId !== id);
}

async function startNewRunner() {
  return new Promise<void>(resolve => {
    const runnerData: ChildRunnerWorkerData = {
      runnerId: getNewIdForResource(kAppResourceType.App),
    };
    const worker = new Worker(__filename, {workerData: runnerData});

    worker.on('message', handleMessage);
    worker.on(
      'online',
      wrapWorkerHandler(callAfterAsync(handleRunnerOnline, resolve), runnerData)
    );
    worker.on('error', wrapWorkerHandler(handleRunnerError, runnerData));
    worker.on('exit', wrapWorkerHandler(handleRunnerExit, runnerData));
  });
}

async function refreshActiveRunnerIds() {
  const runners = await kSemanticModels.app().getManyByQuery({
    type: kAppType.runner,
    lastUpdatedAt: {
      $gte: getTimestamp() - heartbeatInterval * activeRunnerHeartbeatFactor,
    },
  });

  activeRunnerIds = runners.map(runner => runner.resourceId);
}

async function recordHeartbeat() {
  await kSemanticModels
    .utils()
    .withTxn(opts =>
      kSemanticModels
        .app()
        .updateManyByQuery(
          {resourceId: {$in: Object.keys(workers)}},
          {lastUpdatedAt: getTimestamp()},
          opts
        )
    );
  await refreshActiveRunnerIds();
}

async function stopExistingRunner(id: string) {
  await workers[id]?.terminate();
}

function ensureRunnerCount() {
  async function internalFn() {
    const workerIds = Object.keys(workers);
    const workerCount = workerIds.length;

    if (workerCount < runnerCount) {
      await Promise.all(
        new Array(runnerCount - workerCount).fill(0).map(() => startNewRunner)
      );
    } else {
      await Promise.all(workerIds.slice(runnerCount).map(stopExistingRunner));
    }
  }

  if (isMainThread) {
    return kUtilsInjectables
      .promiseStore()
      .executeAfter(internalFn, kEnsureRunnerCountPromiseName)
      .get(kEnsureRunnerCountPromiseName);
  }
  return undefined;
}

function getWorkerData() {
  appAssert(isChildRunnerWorkerData(workerData));
  return workerData;
}

async function refreshChildRunnerActiveRunnerIds() {
  const message: RunnerWorkerMessage = {
    type: kRunnerWorkerMessageType.getActiveRunnerIds,
    runnerId: tryGetRunnerId(),
  };
  const ackMessage = await messageRunner(
    parentPort,
    message,
    /** expectAck */ true,
    /** timeout, 5 secs */ 5_000
  );

  if (
    isRunnerWorkerMessage(ackMessage) &&
    ackMessage.type === kRunnerWorkerMessageType.setActiveRunnerIds
  ) {
    activeRunnerIds = ackMessage.activeRunnerIds;
  }
}

async function beginConsumeJobs() {
  refreshChildRunnerActiveRunnerIds();
  const job = await getNextJob(activeRunnerIds, getWorkerData().runnerId, pickFromShards);

  if (job) {
    await runJob(job);
  }

  beginConsumeJobs();
}

export async function startRunner() {
  if (isMainThread) {
    await ensureRunnerCount();
    recordHeartbeatIntervalHandle = setInterval(recordHeartbeat, heartbeatInterval);
  }
}

export async function stopRunner() {
  if (isMainThread) {
    if (recordHeartbeatIntervalHandle) {
      clearInterval(recordHeartbeatIntervalHandle);
    }

    await Promise.all(Object.values(workers).map(worker => worker.terminate()));
  }
}

export function setRunnerHeartbeatInterval(intervalMs: number) {
  heartbeatInterval = intervalMs;
}

export function getRunnerHeartbeatInterval() {
  return heartbeatInterval;
}

export function setActiveRunnerHeartbeatFactor(factor: number) {
  appAssert(factor > 0);
  activeRunnerHeartbeatFactor = factor;
}

export function getActiveRunnerHeartbeatFactor() {
  return activeRunnerHeartbeatFactor;
}

export function setRunnerCount(count: number, ensureCount = false) {
  appAssert(count >= 0);
  runnerCount = count;

  if (ensureCount) {
    return ensureRunnerCount();
  }

  return undefined;
}

export function getRunnerCount() {
  return runnerCount;
}

export function setRunnerPickFromShards(shards: AppShard[]) {
  pickFromShards = shards;
}

export function getRunnerPickFromShards() {
  return pickFromShards;
}

export function setRunnerShard(runnerShard: AppShard) {
  shard = runnerShard;
}

export function getRunnerShard() {
  return shard;
}

export function getWorkers(): ReadonlyDeep<typeof workers> {
  return workers;
}

export function getActiveRunnerIds(): ReadonlyDeep<typeof activeRunnerIds> {
  return activeRunnerIds;
}

if (isMainThread) {
  registerMessageHandler(handleRunnerMessage);
} else {
  registerMessageHandler(handleRunnerMessage);
  parentPort?.on('message', handleMessage);
  beginConsumeJobs();
}
