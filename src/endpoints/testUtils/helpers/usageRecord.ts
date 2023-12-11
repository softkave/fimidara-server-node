import {defaultTo} from 'lodash';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {Workspace} from '../../../definitions/workspace';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {kSemanticModels} from '../../contexts/injectables';

export async function updateTestWorkspaceUsageLocks(
  id: string,
  categories: UsageRecordCategory[]
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    let workspace = await kSemanticModels.workspace().getOneById(id, opts);
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
    workspace = await kSemanticModels
      .workspace()
      .getAndUpdateOneById(id, {usageThresholdLocks}, opts);
    return {workspace};
  });
}
