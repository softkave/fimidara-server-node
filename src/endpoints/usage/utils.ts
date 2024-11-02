import {sub} from 'date-fns';
import {
  PublicUsageRecord,
  UsageRecord,
  UsageRecordCategory,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
} from '../../definitions/usageRecord.js';
import {Workspace} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {kAppMessages} from '../../utils/messages.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {NotFoundError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';

export function getUsageRecordReportingPeriod() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();

  return {month: month, year: year};
}

export function getUsageRecordPreviousReportingPeriod(
  reportingPeriod: ReturnType<typeof getUsageRecordReportingPeriod>
) {
  return sub(new Date(reportingPeriod.year, reportingPeriod.month), {
    months: 1,
  });
}

export function isUsageRecordPersistent(
  record: Pick<UsageRecord, 'status' | 'category'>
) {
  return (
    record.category === kUsageRecordCategory.storage &&
    record.status === kUsageRecordFulfillmentStatus.fulfilled
  );
}

export function getUsageThreshold(w: Workspace, category: UsageRecordCategory) {
  const thresholds = w.usageThresholds ?? {};
  return thresholds[category];
}

export function workspaceHasUsageThresholds(w: Workspace) {
  const thresholds = w.usageThresholds ?? {};
  return Object.values(kUsageRecordCategory).some(k => {
    const usage = thresholds[k];
    return usage && usage.budget > 0;
  });
}

export function sumWorkspaceThresholds(
  w: Workspace,
  exclude?: UsageRecordCategory[]
) {
  const threshold = w.usageThresholds ?? {};
  return Object.values(kUsageRecordCategory).reduce((acc, k) => {
    if (exclude && exclude.includes(k)) {
      return acc;
    }

    const usage = threshold[k];
    return usage ? acc + usage.budget : acc;
  }, 0);
}

export function throwUsageRecordNotFound() {
  throw new NotFoundError(kAppMessages.usageRecord.notFound());
}

export function assertUsageRecord(item?: UsageRecord | null): asserts item {
  appAssert(item, kReuseableErrors.usageRecord.notFound());
}

const usageRecordFields = getFields<PublicUsageRecord>({
  ...workspaceResourceFields,
  category: true,
  status: true,
  month: true,
  year: true,
  usage: true,
  usageCost: true,
});

export const usageRecordExtractor = makeExtract(usageRecordFields);
export const usageRecordListExtractor = makeListExtract(usageRecordFields);
