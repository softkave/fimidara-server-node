import {AppShardId} from '../../../definitions/app.js';
import {Job} from '../../../definitions/job.js';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../types.js';

export type SemanticJobProvider = SemanticBaseProviderType<Job> & {
  deleteManyByWorkspaceId(
    workspaceId: string,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  getManyByWorkspaceId(
    workspaceId: string,
    opts?: SemanticProviderQueryListParams<Job>
  ): Promise<Job[]>;
  /** Expects `fromShardId` to not contain any active runners, so it migrates
   * "pending" and "in-progress" jobs */
  migrateShard(
    fromShardId: AppShardId,
    toShardId: AppShardId,
    opts: SemanticProviderMutationParams
  ): Promise<void>;
};
