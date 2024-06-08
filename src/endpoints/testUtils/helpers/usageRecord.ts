import {defaultTo} from 'lodash-es';
import {UsageRecordCategory} from '../../../definitions/usageRecord.js';
import {Workspace} from '../../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';

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
        lastUpdatedBy: kSystemSessionAgent,
        lastUpdatedAt: getTimestamp(),
      };
    });
    workspace = await kSemanticModels
      .workspace()
      .getAndUpdateOneById(id, {usageThresholdLocks}, opts);
    return {workspace};
  });
}
