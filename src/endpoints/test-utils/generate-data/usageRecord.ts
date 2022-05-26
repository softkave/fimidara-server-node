import {systemAgent} from '../../../definitions/system';
import {UsageThresholdCategory} from '../../../definitions/usageRecord';
import {getDate} from '../../../utilities/dateFns';
import {generateWorkspace} from './workspace';

export function generateWorkspaceWithCategoryUsageExceeded(
  categories: UsageThresholdCategory[]
) {
  const workspace = generateWorkspace();
  categories.forEach(category => {
    workspace.usageThresholdLocks[category] = {
      category,
      locked: true,
      lastUpdatedBy: systemAgent,
      lastUpdatedAt: getDate(),
    };
  });
  return workspace;
}
