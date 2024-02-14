import {Job} from '../../../../definitions/job';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationTxnOptions,
  SemanticProviderQueryListRunOptions,
} from '../types';

export type SemanticJobProvider = SemanticBaseProviderType<Job> & {
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListRunOptions<Job>
  ): Promise<Job[]>;
};
