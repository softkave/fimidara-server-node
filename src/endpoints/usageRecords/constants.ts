import {UsageRecordCategory} from '../../definitions/usageRecord';

export const usageRecordConstants = {
  defaultTotalThresholdInUSD: 1000,

  /**
   * We leave some wiggle room for requests that slightly exceed the threshold
   * Threshold buffer is 1% of the threshold
   */
  costThresholdBufferPercent: 0.1,
  recordingMonthEndDate: 25, // 25th of the month
  stripeReportingMonthEndDate: 27, // 27th of the month
};

// price is in USD
export const usageCosts: Record<UsageRecordCategory, number> = {
  [UsageRecordCategory.Storage]: 0.046,
  [UsageRecordCategory.BandwidthIn]: 0.18,
  [UsageRecordCategory.BandwidthOut]: 0.27,
  [UsageRecordCategory.Request]: 0.053,
  [UsageRecordCategory.DatabaseObject]: 0.0005,
  [UsageRecordCategory.Total]: 0,
};

export const getCost = (label: UsageRecordCategory, usage: number) => {
  const costPerUnit = usageCosts[label];
  return costPerUnit ? costPerUnit * usage : 0;
};

export function getUsageForCost(label: UsageRecordCategory, cost: number) {
  const costPerUnit = usageCosts[label];
  return costPerUnit ? cost / costPerUnit : 0;
}
