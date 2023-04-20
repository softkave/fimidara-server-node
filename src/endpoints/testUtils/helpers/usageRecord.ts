import {defaultTo} from 'lodash';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {Workspace} from '../../../definitions/workspace';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContext} from '../../contexts/types';

export async function updateTestWorkspaceUsageLocks(
  context: BaseContext,
  id: string,
  categories: UsageRecordCategory[]
) {
  return await executeWithMutationRunOptions(context, async opts => {
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
