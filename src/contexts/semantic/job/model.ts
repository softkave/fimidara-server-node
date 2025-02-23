import {AppShardId} from '../../../definitions/app.js';
import {Job, kJobStatus} from '../../../definitions/job.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {SemanticProviderMutationParams} from '../types.js';
import {SemanticJobProvider} from './types.js';

export class DataSemanticJob
  extends SemanticWorkspaceResourceProvider<Job>
  implements SemanticJobProvider
{
  async migrateShard(
    fromShardId: AppShardId,
    toShardId: AppShardId,
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<Job>>(
      {
        shard: fromShardId,
        // It's okay to migrate "in-progress" jobs seeing calling migrateShard
        // expects the source shard to not contain any active runners
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        status: {$in: [kJobStatus.pending, kJobStatus.inProgress]},
      },
      opts?.includeDeleted || false
    );
    await this.data.updateManyByQuery(query, {shard: toShardId}, opts);
  }
}
