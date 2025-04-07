import {random} from 'lodash-es';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
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
import {getCostForUsage} from '../../usageRecords/constants.js';
import {isUsageRecordPersistent} from '../../usageRecords/utils.js';

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
    const status = randomFulfillmentStatus();
    const category = extra.category ?? randomCategory();
    const usage = extra.usage ?? 0;
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
      usage,
      usageCost: getCostForUsage(category, usage),
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
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.usageRecord().insertItem(items, opts));

  return items;
}
