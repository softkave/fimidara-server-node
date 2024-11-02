import {random} from 'lodash-es';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  UsageRecord,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {isUsageRecordPersistent} from '../../usage/utils.js';

function randomCategory() {
  const categories = Object.values(kUsageRecordCategory);
  return categories[random(0, categories.length - 1)];
}

function randomSummationType() {
  const r = random(0, 1);
  return r === 0 ? kUsageSummationType.instance : kUsageSummationType.month;
}

function randomFulfillmentStatus() {
  const items = Object.values(kUsageRecordFulfillmentStatus);
  return items[random(0, items.length - 1)];
}

export function generateUsageRecordList(
  count = 10,
  extra: Partial<UsageRecord> = {}
) {
  const records: UsageRecord[] = [];

  for (let i = 0; i < count; i++) {
    const category = randomCategory();
    const status = randomFulfillmentStatus();
    records.push({
      persistent: isUsageRecordPersistent({
        category,
        status: status,
      }),
      workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
      resourceId: getNewIdForResource(kFimidaraResourceType.UsageRecord),
      status: randomFulfillmentStatus(),
      summationType: randomSummationType(),
      lastUpdatedBy: kSystemSessionAgent,
      createdBy: kSystemSessionAgent,
      lastUpdatedAt: getTimestamp(),
      category: randomCategory(),
      createdAt: getTimestamp(),
      year: random(1, 10_000),
      month: random(0, 11),
      isDeleted: false,
      artifacts: [],
      usageCost: 0,
      usage: 0,
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
    .withTxn(async opts =>
      kSemanticModels.usageRecord().insertItem(items, opts)
    );

  return items;
}
