import {getDeferredPromise} from 'softkave-js-utils';
import {kIjxSemantic, kIkxUtils} from '../contexts/ijx/injectables.js';
import {kJobStatus} from '../definitions/job.js';

export async function runScript(params: {
  name: string;
  isUnique: boolean;
  fn: () => Promise<void>;
  isMandatory?: boolean;
}) {
  const scriptProvider = kIjxSemantic.script();
  const result = await scriptProvider.tryStartScript({
    name: params.name,
    uniqueId: params.isUnique ? params.name : undefined,
  });

  if (!result.inserted) {
    kIkxUtils
      .logger()
      .log(`Waiting for script to complete: ${result.script.name}`);

    const deferred = getDeferredPromise();
    const pollIntervalMs = kIkxUtils.suppliedConfig().scriptPollIntervalMs;

    await scriptProvider.pollScriptStatus({
      scriptId: result.script.resourceId,
      intervalMs: pollIntervalMs,
      cb: status => {
        if (status.status === kJobStatus.completed) {
          deferred.resolve();
        } else if (status.status === kJobStatus.failed) {
          if (params.isMandatory) {
            deferred.reject(new Error(`Script failed: ${result.script.name}`));
          } else {
            deferred.resolve();
            kIkxUtils.logger().log(`Script failed: ${result.script.name}`);
          }
        } else if (status.isRunnerHeartbeatStale) {
          if (params.isMandatory) {
            deferred.reject(
              new Error(`Script heartbeat stale: ${result.script.name}`)
            );
          } else {
            deferred.resolve();
            kIkxUtils
              .logger()
              .log(`Script heartbeat stale: ${result.script.name}`);
          }
        }
      },
    });

    await deferred.promise;
    kIkxUtils.logger().log(`Script completed: ${result.script.name}`);
    return;
  }

  try {
    kIkxUtils.logger().log(`Running script: ${result.script.name}`);
    await params.fn();
    kIkxUtils.logger().log(`Script completed: ${result.script.name}`);
    await kIjxSemantic.utils().withTxn(async opts => {
      await scriptProvider.endScript(
        {scriptId: result.script.resourceId, status: kJobStatus.completed},
        opts
      );
    });
  } catch (error) {
    kIkxUtils.logger().log(`Script failed: ${result.script.name}`);
    await kIjxSemantic.utils().withTxn(async opts => {
      await scriptProvider.endScript(
        {scriptId: result.script.resourceId, status: kJobStatus.failed},
        opts
      );
    });

    if (params.isMandatory) {
      throw error;
    }
  }
}
