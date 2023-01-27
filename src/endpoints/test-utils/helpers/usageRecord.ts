import {defaultTo} from 'lodash';
import {systemAgent} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace} from '../../../definitions/workspace';
import {getDate} from '../../../utils/dateFns';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';

export async function updateTestWorkspaceUsageLocks(
  context: IBaseContext,
  id: string,
  categories: UsageRecordCategory[]
) {
  let workspace = await context.data.workspace.getOneByQuery(EndpointReusableQueries.getById(id));
  const usageThresholdLocks: IWorkspace['usageThresholdLocks'] = {
    ...defaultTo(workspace?.usageThresholdLocks, {}),
  };
  categories.forEach(category => {
    usageThresholdLocks[category] = {
      category,
      locked: true,
      lastUpdatedBy: systemAgent,
      lastUpdatedAt: getDate(),
    };
  });
  workspace = await context.data.workspace.assertGetAndUpdateOneByQuery(EndpointReusableQueries.getById(id), {
    usageThresholdLocks,
  });
  return {workspace};
}
