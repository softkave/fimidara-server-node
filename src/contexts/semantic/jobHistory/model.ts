import {first} from 'lodash-es';
import {JobStatus} from '../../../definitions/job.js';
import {JobHistory} from '../../../definitions/jobHistory.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {SemanticProviderQueryParams} from '../types.js';
import {SemanticJobHistoryProvider} from './types.js';

export class DataSemanticJobHistory
  extends SemanticWorkspaceResourceProvider<JobHistory>
  implements SemanticJobHistoryProvider
{
  async getJobLastHistoryItem(
    jobId: string,
    status: JobStatus | undefined,
    opts?: SemanticProviderQueryParams<JobHistory> | undefined
  ): Promise<JobHistory | null> {
    const query = addIsDeletedIntoQuery<DataQuery<JobHistory>>(
      {jobId, status},
      opts?.includeDeleted || false
    );
    const jobHistoryList = await this.data.getManyByQuery(query, {
      ...opts,
      pageSize: 1,
      sort: {createdAt: 'desc'},
    });

    return first(jobHistoryList) || null;
  }
}
