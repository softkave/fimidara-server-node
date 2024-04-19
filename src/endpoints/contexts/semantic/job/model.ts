import {AppShardId} from '../../../../definitions/app';
import {Job, kJobStatus} from '../../../../definitions/job';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationParams} from '../types';
import {SemanticJobProvider} from './types';

export class DataSemanticJob
  extends DataSemanticWorkspaceResourceProvider<Job>
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
