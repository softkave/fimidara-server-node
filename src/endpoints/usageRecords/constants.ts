import {Agent} from '../../definitions/system.js';
import {
  UsageRecordCategory,
  kUsageRecordCategory,
} from '../../definitions/usageRecord.js';
import {Workspace} from '../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {kEndpointConstants} from '../constants.js';

export const kUsageRecordConstants = {
  defaultTotalThresholdInUSD: 30,
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
    countWorkspaceSummedUsage: `${kEndpointConstants.apiv1}/usageRecords/countWorkspaceSummedUsage`,
    getWorkspaceSummedUsage: `${kEndpointConstants.apiv1}/usageRecords/getWorkspaceSummedUsage`,
    getUsageCosts: `${kEndpointConstants.apiv1}/usageRecords/getUsageCosts`,
  },
};

// price is in USD per gb
export const usageCostsPerGb: Record<UsageRecordCategory, number> = {
  [kUsageRecordCategory.storageEverConsumed]: 0.046,
  [kUsageRecordCategory.bandwidthOut]: 0.27,
  [kUsageRecordCategory.bandwidthIn]: 0.18,
  [kUsageRecordCategory.storage]: 0.046,
  [kUsageRecordCategory.total]: 0,
};

const kBytesInGb = 1024 * 1024 * 1024;

// price is in USD per byte
export const kUsageCosts: Record<UsageRecordCategory, number> = {
  [kUsageRecordCategory.storage]:
    usageCostsPerGb[kUsageRecordCategory.storage] / kBytesInGb,
  [kUsageRecordCategory.storageEverConsumed]:
    usageCostsPerGb[kUsageRecordCategory.storageEverConsumed] / kBytesInGb,
  [kUsageRecordCategory.bandwidthIn]:
    usageCostsPerGb[kUsageRecordCategory.bandwidthIn] / kBytesInGb,
  [kUsageRecordCategory.bandwidthOut]:
    usageCostsPerGb[kUsageRecordCategory.bandwidthOut] / kBytesInGb,
  [kUsageRecordCategory.total]: 0,
};

export const getCostForUsage = (
  catgory: UsageRecordCategory,
  usage: number
) => {
  const costPerUnit = kUsageCosts[catgory];
  return costPerUnit ? costPerUnit * usage : 0;
};

export function getUsageForCost(category: UsageRecordCategory, cost: number) {
  const costPerUnit = kUsageCosts[category];
  return costPerUnit ? cost / costPerUnit : 0;
}

export function getDefaultThresholds(agent: Agent = kSystemSessionAgent) {
  const defaultUsageThresholds: Workspace['usageThresholds'] = {
    [kUsageRecordCategory.total]: {
      usage: getUsageForCost(
        kUsageRecordCategory.storage,
        kUsageRecordConstants.defaultTotalThresholdInUSD
      ),
      budget: kUsageRecordConstants.defaultTotalThresholdInUSD,
      category: kUsageRecordCategory.storage,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: agent,
    },
  };

  return defaultUsageThresholds;
}
