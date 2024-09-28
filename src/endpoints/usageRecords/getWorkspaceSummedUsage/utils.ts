import {endOfMonth, startOfMonth} from 'date-fns';
import {LiteralDataQuery} from '../../../contexts/data/types.js';
import {SessionAgent} from '../../../definitions/system.js';
import {
  UsageRecord,
  kUsageRecordFulfillmentStatus,
  kUsageSummationType,
} from '../../../definitions/usageRecord.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {convertToArray} from '../../../utils/fns.js';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils.js';
import {GetWorkspaceSummedUsageEndpointParams} from './types.js';

export async function getWorkspaceSummedUsageQuery(
  agent: SessionAgent,
  workspaceId: string,
  data: GetWorkspaceSummedUsageEndpointParams
) {
  // TODO: should we include permissions check for usage records?
  await checkWorkspaceAuthorization02(agent, 'readUsageRecord', workspaceId);

  const query: LiteralDataQuery<UsageRecord> = {
    workspaceId: {$eq: workspaceId},
    summationType: {$eq: kUsageSummationType.month},
  };

  if (data.query?.fromDate || data.query?.toDate) {
    query.createdAt = {
      $gte: data.query?.fromDate
        ? getTimestamp(startOfMonth(data.query.fromDate))
        : undefined,
      $lte: data.query?.toDate
        ? getTimestamp(endOfMonth(data.query.toDate))
        : undefined,
    };
  }

  if (data.query?.category) {
    // @ts-ignore
    query.category = {$in: convertToArray(data.query.category)};
  }

  // don't include the fulfillment status if it's undecided
  if (data.query?.fulfillmentStatus) {
    query.status = {
      // @ts-ignore
      $in: convertToArray(data.query.fulfillmentStatus),
    };
  } else {
    query.status = {
      $in: [
        // @ts-ignore
        kUsageRecordFulfillmentStatus.fulfilled,
        kUsageRecordFulfillmentStatus.dropped,
      ],
    };
  }

  return {query};
}
