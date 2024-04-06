import {AppShardId} from '../../../../definitions/app';
import {Job, kJobStatus} from '../../../../definitions/job';
import {DataQuery} from '../../data/types';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationTxnOptions} from '../types';
import {SemanticJobProvider} from './types';

export class DataSemanticJob
  extends DataSemanticWorkspaceResourceProvider<Job>
  implements SemanticJobProvider
{
  async migrateShard(
    fromShardId: AppShardId,
    toShardId: AppShardId,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    const query: DataQuery<Job> = {
      shard: fromShardId,
      // It's okay to migrate "in-progress" jobs seeing calling migrateShard
      // expects the source shard to not contain any active runners
      // @ts-ignore
      status: {$in: [kJobStatus.pending, kJobStatus.inProgress]},
    };
    await this.data.updateManyByQuery(query, {shard: toShardId}, opts);
  }
}
