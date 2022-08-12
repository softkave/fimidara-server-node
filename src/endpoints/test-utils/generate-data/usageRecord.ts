import {defaultTo, random} from 'lodash';
import {systemAgent} from '../../../definitions/system';
import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getDate} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {generateTestWorkspace} from './workspace';

export function generateWorkspaceWithCategoryUsageExceeded(
  categories: UsageRecordCategory[]
) {
  const workspace = generateTestWorkspace();
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

function randomCategory() {
  const categories = Object.values(UsageRecordCategory);
  return categories[random(0, categories.length - 1)];
}

function randomSummationType() {
  const r = random(0, 1);
  return r === 0 ? UsageSummationType.One : UsageSummationType.Two;
}

function randomFulfillmentStatus() {
  const items = Object.values(UsageRecordFulfillmentStatus);
  return items[random(0, items.length - 1)];
}

export function generateUsageRecords(
  workspaceId: string,
  count = 10,
  extra: Partial<IUsageRecord> = {}
) {
  const records: IUsageRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      workspaceId,
      month: random(0, 11),
      year: random(0, 11),
      resourceId: getNewId(),
      createdAt: new Date(),
      createdBy: systemAgent,
      lastUpdatedAt: new Date(),
      lastUpdatedBy: systemAgent,
      category: randomCategory(),
      summationType: randomSummationType() as any,
      fulfillmentStatus: randomFulfillmentStatus(),
      usage: 0,
      usageCost: 0,
      artifacts: [],
      ...extra,
    });
  }

  return records;
}
