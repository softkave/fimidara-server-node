import {defaultTo, random} from 'lodash-es';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  UsageRecord,
  UsageRecordCategory,
  UsageRecordCategoryMap,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateTestWorkspace} from './workspace.js';

export function generateWorkspaceWithCategoryUsageExceeded(
  categories: UsageRecordCategory[]
) {
  const workspace = generateTestWorkspace();
  const usageLocks = defaultTo(workspace.usageThresholdLocks, {});
  categories.forEach(category => {
    usageLocks[category] = {
      category,
      locked: true,
      lastUpdatedBy: kSystemSessionAgent,
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

export function generateUsageRecordList(
  count = 10,
  extra: Partial<UsageRecord> = {}
) {
  const records: UsageRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
      month: random(0, 11),
      year: random(1, 10_000),
      resourceId: getNewIdForResource(kFimidaraResourceType.UsageRecord),
      createdAt: getTimestamp(),
      createdBy: kSystemSessionAgent,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: kSystemSessionAgent,
      category: randomCategory(),
      summationType: randomSummationType(),
      fulfillmentStatus: randomFulfillmentStatus(),
      usage: 0,
      usageCost: 0,
      artifacts: [],
      isDeleted: false,
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
    .withTxn(
      async opts => kSemanticModels.usageRecord().insertItem(items, opts),
      /** reuseTxn */ true
    );
  return items;
}
