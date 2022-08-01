import {IAgent, systemAgent} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';

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

export const getCostForUsage = (
  catgory: UsageRecordCategory,
  usage: number
) => {
  const costPerUnit = usageCosts[catgory];
  return costPerUnit ? costPerUnit * usage : 0;
};

export function getUsageForCost(category: UsageRecordCategory, cost: number) {
  const costPerUnit = usageCosts[category];
  return costPerUnit ? cost / costPerUnit : 0;
}

export function getDefaultThresholds(agent: IAgent = systemAgent) {
  const date = new Date();
  const defaultUsageThresholds: IWorkspace['usageThresholds'] = {
    [UsageRecordCategory.Total]: {
      category: UsageRecordCategory.Storage,
      budget: usageRecordConstants.defaultTotalThresholdInUSD,
      lastUpdatedBy: agent,
      lastUpdatedAt: date,
    },
  };

  return defaultUsageThresholds;
}
