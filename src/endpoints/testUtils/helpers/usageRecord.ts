import {defaultTo} from 'lodash';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {Workspace} from '../../../definitions/workspace';
import {kSystemSessionAgent} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {kSemanticModels} from '../../contexts/injection/injectables';

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
  }, /** reuseTxn */ true);
}
