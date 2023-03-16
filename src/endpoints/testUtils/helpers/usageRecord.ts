import {defaultTo} from 'lodash';
import {SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {IBaseContext} from '../../contexts/types';

export async function updateTestWorkspaceUsageLocks(
  context: IBaseContext,
  id: string,
  categories: UsageRecordCategory[]
) {
  let workspace = await context.semantic.workspace.getOneById(id);
  const usageThresholdLocks: IWorkspace['usageThresholdLocks'] = {
    ...defaultTo(workspace?.usageThresholdLocks, {}),
  };
  categories.forEach(category => {
    usageThresholdLocks[category] = {
      category,
      locked: true,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
      lastUpdatedAt: getTimestamp(),
    };
  });
  workspace = await context.semantic.workspace.getAndUpdateOneById(id, {usageThresholdLocks});
  return {workspace};
}
