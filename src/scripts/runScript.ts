import {getDeferredPromise} from 'softkave-js-utils';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables.js';
import {kJobStatus} from '../definitions/job.js';

export async function runScript(params: {
  name: string;
  isUnique: boolean;
  fn: () => Promise<void>;
  isMandatory?: boolean;
}) {
  const scriptProvider = kSemanticModels.script();
  const result = await scriptProvider.tryStartScript({
    name: params.name,
    uniqueId: params.isUnique ? params.name : undefined,
  });

  if (!result.inserted) {
    kUtilsInjectables
      .logger()
      .log(`Waiting for script to complete: ${result.script.name}`);

    const deferred = getDeferredPromise();
    const pollIntervalMs =
      kUtilsInjectables.suppliedConfig().scriptPollIntervalMs;

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
            kUtilsInjectables
              .logger()
              .log(`Script failed: ${result.script.name}`);
          }
        } else if (status.isRunnerHeartbeatStale) {
          if (params.isMandatory) {
            deferred.reject(
              new Error(`Script heartbeat stale: ${result.script.name}`)
            );
          } else {
            deferred.resolve();
            kUtilsInjectables
              .logger()
              .log(`Script heartbeat stale: ${result.script.name}`);
          }
        }
      },
    });

    await deferred.promise;
    kUtilsInjectables.logger().log(`Script completed: ${result.script.name}`);
    return;
  }

  try {
    kUtilsInjectables.logger().log(`Running script: ${result.script.name}`);
    await params.fn();
    kUtilsInjectables.logger().log(`Script completed: ${result.script.name}`);
    await kSemanticModels.utils().withTxn(async opts => {
      await scriptProvider.endScript(
        {scriptId: result.script.resourceId, status: kJobStatus.completed},
        opts
      );
    });
  } catch (error) {
    kUtilsInjectables.logger().log(`Script failed: ${result.script.name}`);
    await kSemanticModels.utils().withTxn(async opts => {
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
