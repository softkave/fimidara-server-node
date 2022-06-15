import {defaultTo} from 'lodash';
import {systemAgent} from '../../../definitions/system';
import {
  UsageRecordCategory,
  UsageThresholdCategory,
} from '../../../definitions/usageRecord';
import {IWorkspace} from '../../../definitions/workspace';
import {getDate} from '../../../utilities/dateFns';
import {IBaseContext} from '../../contexts/BaseContext';

export async function updateTestWorkspaceUsageLocks(
  context: IBaseContext,
  id: string,
  categories: UsageThresholdCategory[]
) {
  let workspace = await context.cacheProviders.workspace.getById(context, id);
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
  workspace = await context.cacheProviders.workspace.updateById(context, id, {
    [`usageThresholdLocks.${UsageRecordCategory.Storage}`]: {
      category: UsageRecordCategory.Storage,
      locked: true,
      lastUpdatedBy: systemAgent,
      lastUpdatedAt: getDate(),
    },
  });
  return {workspace};
}