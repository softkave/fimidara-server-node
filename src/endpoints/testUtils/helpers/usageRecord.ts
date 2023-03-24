import {defaultTo} from 'lodash';
import {SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

export async function updateTestWorkspaceUsageLocks(
  context: IBaseContext,
  id: string,
  categories: UsageRecordCategory[]
) {
  return await executeWithMutationRunOptions(context, async opts => {
    let workspace = await context.semantic.workspace.getOneById(id, opts);
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
    workspace = await context.semantic.workspace.getAndUpdateOneById(
      id,
      {usageThresholdLocks},
      opts
    );
    return {workspace};
  });
}
