import {getNewId} from 'softkave-js-utils';
import {JobStatus, kJobStatus} from '../../../definitions/job.js';
import {AppScript} from '../../../definitions/script.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {newResource} from '../../../utils/resource.js';
import {kIjxData, kIjxSemantic, kIjxUtils} from '../../ijx/injectables.js';
import {SemanticBaseProvider} from '../SemanticBaseProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {
  ISemanticScriptProvider,
  SemanticScriptPollStatus,
  SemanticScriptStatus,
} from './types.js';

const kScriptPollIntervalMs = 60 * 1000; // 1 minute

export class SemanticScriptProvider
  extends SemanticBaseProvider<AppScript>
  implements ISemanticScriptProvider
{
  async tryStartScript(params: {name: string; uniqueId?: string}): Promise<{
    inserted: boolean;
    script: AppScript;
  }> {
    const uniqueId = params.uniqueId ?? getNewId();
    const appId = kIjxUtils.serverApp().getAppId();
    const script = newResource<AppScript>(kFimidaraResourceType.script, {
      name: params.name,
      uniqueId,
      status: kJobStatus.pending,
      statusLastUpdatedAt: Date.now(),
      appId,
    });

    try {
      const insertedScript = await kIjxSemantic.utils().withTxn(async opts => {
        return await this.data.insertItem(script, opts);
      });

      return {inserted: true, script: insertedScript};
    } catch (error) {
      if (kIjxData.utils().isUniqueConstraintViolation(error)) {
        const script = await this.getScript({
          name: params.name,
          uniqueId: params.uniqueId,
        });

        appAssert(script, `failed to start script ${params.name}`);
        return {
          inserted: false,
          script,
        };
      }

      throw error;
    }
  }

  async pollScriptStatus(params: {
    scriptId: string;
    intervalMs?: number;
    cb: (status: SemanticScriptPollStatus) => void;
  }): Promise<{stop: () => void}> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    let intervalHandle: NodeJS.Timeout | undefined;

    const stop = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (intervalHandle) clearInterval(intervalHandle);
      timeoutHandle = undefined;
      intervalHandle = undefined;
    };

    const managedCb = async () => {
      const status = await this.getScriptStatus(params.scriptId);

      if (
        status.status === kJobStatus.completed ||
        status.status === kJobStatus.failed
      ) {
        stop();
      }

      params.cb({...status, stop});
      return status;
    };

    timeoutHandle = setTimeout(async () => {
      const status = await managedCb();

      if (status.status === kJobStatus.pending) {
        intervalHandle = setInterval(
          managedCb,
          params.intervalMs ?? kScriptPollIntervalMs
        );
        intervalHandle.unref();
      }
    }, params.intervalMs ?? kScriptPollIntervalMs);

    timeoutHandle.unref();
    return {stop};
  }

  async endScript(
    params: {scriptId: string; status: JobStatus},
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    await this.updateOneById(
      params.scriptId,
      {
        status: params.status,
        statusLastUpdatedAt: Date.now(),
      },
      opts
    );
  }

  async getScript(
    params: {name?: string; uniqueId?: string},
    opts?: SemanticProviderQueryParams<AppScript>
  ): Promise<AppScript | null> {
    return await this.data.getOneByQuery(
      {
        name: params.name,
        uniqueId: params.uniqueId,
      },
      opts
    );
  }

  public async getScriptStatus(
    scriptId: string
  ): Promise<SemanticScriptStatus> {
    const script = await this.getOneById(scriptId);
    appAssert(script, `script not found ${scriptId}`);

    const isRunnerAlive = kIjxUtils.serverApp().isAppAlive(script.appId);

    return {
      status: script.status,
      isRunnerHeartbeatStale: !isRunnerAlive,
    };
  }

  async deleteFailedScripts(
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    await this.deleteManyByQuery({status: kJobStatus.failed}, opts);
  }

  async deleteStaleScripts(
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const cutoffMs = kIjxUtils.serverApp().getHeartbeatCutoffMs();
    await this.deleteManyByQuery(
      {
        statusLastUpdatedAt: {$lt: cutoffMs},
        status: kJobStatus.pending,
      },
      opts
    );
  }
}
