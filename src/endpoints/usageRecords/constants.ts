import {IAgent, SYSTEM_SESSION_AGENT} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import {getTimestamp} from '../../utils/dateFns';
import {endpointConstants} from '../constants';

export const usageRecordConstants = {
  defaultTotalThresholdInUSD: 5,

  /**
   * We leave some wiggle room for requests that slightly exceed the threshold
   * Threshold buffer is 1% of the threshold
   */
  costThresholdBufferPercent: 0.1,

  /**
   * 25th of the month. Using 24 below, cause JS date is 0-indexed.
   */
  recordingMonthEndDate: 24,
  stripeReportingMonthEndDate: 26, // 27th of the month
  routes: {
    getUsageCosts: `${endpointConstants.apiv1}/usageRecords/getUsageCosts`,
    getWorkspaceSummedUsage: `${endpointConstants.apiv1}/usageRecords/getWorkspaceSummedUsage`,
  },
};

// price is in USD per gb
export const usageCostsPerGb: Record<UsageRecordCategory, number> = {
  [UsageRecordCategory.Storage]: 0.046,
  [UsageRecordCategory.BandwidthIn]: 0.18,
  [UsageRecordCategory.BandwidthOut]: 0.27,
  // [UsageRecordCategory.Request]: 0.053,
  // [UsageRecordCategory.DatabaseObject]: 0.0005,
  [UsageRecordCategory.Total]: 0,
};

const bytesInGb = 1024 * 1024 * 1024;

// price is in USD per byte
export const usageCosts: Record<UsageRecordCategory, number> = {
  [UsageRecordCategory.Storage]: usageCostsPerGb[UsageRecordCategory.Storage] / bytesInGb,
  [UsageRecordCategory.BandwidthIn]: usageCostsPerGb[UsageRecordCategory.BandwidthIn] / bytesInGb,
  [UsageRecordCategory.BandwidthOut]: usageCostsPerGb[UsageRecordCategory.BandwidthOut] / bytesInGb,
  [UsageRecordCategory.Total]: 0,
};

export const getCostForUsage = (catgory: UsageRecordCategory, usage: number) => {
  const costPerUnit = usageCosts[catgory];
  return costPerUnit ? costPerUnit * usage : 0;
};

export function getUsageForCost(category: UsageRecordCategory, cost: number) {
  const costPerUnit = usageCosts[category];
  return costPerUnit ? cost / costPerUnit : 0;
}

export function getDefaultThresholds(agent: IAgent = SYSTEM_SESSION_AGENT) {
  const defaultUsageThresholds: IWorkspace['usageThresholds'] = {
    [UsageRecordCategory.Total]: {
      category: UsageRecordCategory.Storage,
      budget: usageRecordConstants.defaultTotalThresholdInUSD,
      lastUpdatedBy: agent,
      lastUpdatedAt: getTimestamp(),
    },
  };

  return defaultUsageThresholds;
}
