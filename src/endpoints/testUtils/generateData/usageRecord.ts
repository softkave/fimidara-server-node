import {defaultTo, random} from 'lodash';
import {AppResourceTypeMap} from '../../../definitions/system';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordCategoryMap,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
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
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
      lastUpdatedAt: getTimestamp(),
    };
  });
  return workspace;
}

function randomCategory() {
  const categories = Object.values(UsageRecordCategoryMap);
  return categories[random(0, categories.length - 1)];
}

function randomSummationType() {
  const r = random(0, 1);
  return r === 0 ? UsageSummationTypeMap.Instance : UsageSummationTypeMap.Month;
}

function randomFulfillmentStatus() {
  const items = Object.values(UsageRecordFulfillmentStatusMap);
  return items[random(0, items.length - 1)];
}

export function generateUsageRecordList(count = 10, extra: Partial<UsageRecord> = {}) {
  const records: UsageRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
      month: random(0, 11),
      year: random(1, 10_000),
      resourceId: getNewIdForResource(AppResourceTypeMap.UsageRecord),
      createdAt: getTimestamp(),
      createdBy: SYSTEM_SESSION_AGENT,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: SYSTEM_SESSION_AGENT,
      category: randomCategory(),
      summationType: randomSummationType(),
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
  count = 20,
  extra: Partial<UsageRecord> = {}
) {
  const items = generateUsageRecordList(count, extra);
  await kSemanticModels
    .utils()
    .withTxn(async opts => kSemanticModels.usageRecord().insertItem(items, opts));
  return items;
}
