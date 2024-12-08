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
  defaultTotalThresholdInUSD: 50,
  routes: {
    countWorkspaceSummedUsage: `${kEndpointConstants.apiv1}/usageRecords/countWorkspaceSummedUsage`,
    getWorkspaceSummedUsage: `${kEndpointConstants.apiv1}/usageRecords/getWorkspaceSummedUsage`,
    getUsageCosts: `${kEndpointConstants.apiv1}/usageRecords/getUsageCosts`,
  },
};

/** Price is in USD per gb */
export const kUsageCostsPerGb: Record<UsageRecordCategory, number> = {
  [kUsageRecordCategory.storageEverConsumed]: 0.001,
  [kUsageRecordCategory.bandwidthOut]: 0.001,
  [kUsageRecordCategory.bandwidthIn]: 0.001,
  [kUsageRecordCategory.storage]: 0.018,
  [kUsageRecordCategory.total]: 0,
};

const kBytesInGb = 1024 * 1024 * 1024;

/** Price is in USD per byte */
export const kUsageCostsPerByte: Record<UsageRecordCategory, number> = {
  [kUsageRecordCategory.storage]:
    kUsageCostsPerGb[kUsageRecordCategory.storage] / kBytesInGb,
  [kUsageRecordCategory.storageEverConsumed]:
    kUsageCostsPerGb[kUsageRecordCategory.storageEverConsumed] / kBytesInGb,
  [kUsageRecordCategory.bandwidthIn]:
    kUsageCostsPerGb[kUsageRecordCategory.bandwidthIn] / kBytesInGb,
  [kUsageRecordCategory.bandwidthOut]:
    kUsageCostsPerGb[kUsageRecordCategory.bandwidthOut] / kBytesInGb,
  [kUsageRecordCategory.total]: 0,
};

export const getCostForUsage = (
  catgory: UsageRecordCategory,
  usage: number
) => {
  const costPerUnit = kUsageCostsPerByte[catgory];
  return costPerUnit ? costPerUnit * usage : 0;
};

export function getStringCostForUsage(
  catgory: UsageRecordCategory,
  usage: number
) {
  return getCostForUsage(catgory, usage).toFixed(2);
}

export function getUsageForCost(category: UsageRecordCategory, cost: number) {
  const costPerUnit = kUsageCostsPerByte[category];
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
