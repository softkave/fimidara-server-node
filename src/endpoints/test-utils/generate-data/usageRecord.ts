import {defaultTo} from 'lodash';
import {systemAgent} from '../../../definitions/system';
import {UsageThresholdCategory} from '../../../definitions/usageRecord';
import {getDate} from '../../../utilities/dateFns';
import {generateWorkspace} from './workspace';

export function generateWorkspaceWithCategoryUsageExceeded(
  categories: UsageThresholdCategory[]
) {
  const workspace = generateWorkspace();
  const usageLocks = defaultTo(workspace.usageThresholdLocks, {});
  categories.forEach(category => {
    usageLocks[category] = {
      category,
      locked: true,
      lastUpdatedBy: systemAgent,
      lastUpdatedAt: getDate(),
    };
  });
  return workspace;
}
