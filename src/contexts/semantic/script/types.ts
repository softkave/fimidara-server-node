import {JobStatus} from '../../../definitions/job.js';
import {AppScript} from '../../../definitions/script.js';
import {SemanticBaseProvider} from '../SemanticBaseProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryParams,
} from '../types.js';

export interface SemanticScriptStatus {
  status: JobStatus;
  isRunnerHeartbeatStale: boolean;
}

export interface SemanticScriptPollStatus extends SemanticScriptStatus {
  stop: () => void;
}

export interface ISemanticScriptProvider
  extends SemanticBaseProvider<AppScript> {
  tryStartScript(params: {name: string; uniqueId?: string}): Promise<{
    inserted: boolean;
    script: AppScript;
  }>;
  pollScriptStatus(params: {
    scriptId: string;
    intervalMs?: number;
    cb: (status: SemanticScriptPollStatus) => void;
  }): Promise<{stop: () => void}>;
  getScriptStatus(scriptId: string): Promise<SemanticScriptStatus>;
  endScript(
    params: {scriptId: string; status: JobStatus},
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getScript(
    params: {name?: string; uniqueId?: string},
    opts?: SemanticProviderQueryParams<AppScript>
  ): Promise<AppScript | null>;
  deleteFailedScripts(opts: SemanticProviderMutationParams): Promise<void>;
  deleteStaleScripts(opts: SemanticProviderMutationParams): Promise<void>;
}
