import {defaultTo} from 'lodash';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {Workspace} from '../../../definitions/workspace';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {BaseContextType} from '../../contexts/types';

export async function updateTestWorkspaceUsageLocks(
  context: BaseContextType,
  id: string,
  categories: UsageRecordCategory[]
) {
  return await context.semantic.utils.withTxn(context, async opts => {
    let workspace = await context.semantic.workspace.getOneById(id, opts);
    const usageThresholdLocks: Workspace['usageThresholdLocks'] = {
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
    workspace = await context.semantic.workspace.getAndUpdateOneById(
      id,
      {usageThresholdLocks},
      opts
    );
    return {workspace};
  });
}
