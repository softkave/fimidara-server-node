import {AppShardId} from '../../../../definitions/app';
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
  /** Expects `fromShardId` to not contain any active runners, so it migrates
   * "pending" and "in-progress" jobs */
  migrateShard(
    fromShardId: AppShardId,
    toShardId: AppShardId,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
};
