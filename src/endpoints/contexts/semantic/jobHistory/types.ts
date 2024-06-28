import {JobHistory} from '../../../../definitions/jobHistory.js';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationParams,
} from '../types.js';

export type SemanticJobHistoryProvider =
  SemanticBaseProviderType<JobHistory> & {
    deleteManyByWorkspaceId(
      workspaceId: string,
      opts: SemanticProviderMutationParams
    ): Promise<void>;
  };
