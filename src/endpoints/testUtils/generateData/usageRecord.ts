import {defaultTo, random} from 'lodash';
import {AppResourceType, SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {generateTestWorkspace} from './workspace';

export function generateWorkspaceWithCategoryUsageExceeded(categories: UsageRecordCategory[]) {
  const workspace = generateTestWorkspace();
  const usageLocks = defaultTo(workspace.usageThresholdLocks, {});
  categories.forEach(category => {
    usageLocks[category] = {
      category,
      locked: true,
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
      lastUpdatedAt: getTimestamp(),
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

export function generateUsageRecordList(count = 10, extra: Partial<IUsageRecord> = {}) {
  const records: IUsageRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      workspaceId: getNewIdForResource(AppResourceType.Workspace),
      month: random(0, 11),
      year: random(0, 11),
      resourceId: getNewIdForResource(AppResourceType.UsageRecord),
      createdAt: getTimestamp(),
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
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

export async function generateAndInsertUsageRecordList(
  ctx: IBaseContext,
  count = 20,
  extra: Partial<IUsageRecord> = {}
) {
  const items = generateUsageRecordList(count, extra);
  await ctx.semantic.usageRecord.insertList(items);
  return items;
}
