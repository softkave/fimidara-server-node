import {endOfMonth, startOfMonth} from 'date-fns';
import {SessionAgent} from '../../../definitions/system';
import {
  UsageRecord,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getTimestamp} from '../../../utils/dateFns';
import {toArray} from '../../../utils/fns';
import {LiteralDataQuery} from '../../contexts/data/types';
import {BaseContextType} from '../../contexts/types';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils';
import {GetWorkspaceSummedUsageEndpointParams} from './types';

export async function getWorkspaceSummedUsageQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string,
  data: GetWorkspaceSummedUsageEndpointParams
) {
  // TODO: should we include permissions check for usage records?
  await checkWorkspaceAuthorization02(context, agent, 'readUsageRecord', workspaceId);

  const query: LiteralDataQuery<UsageRecord> = {
    workspaceId: {$eq: workspaceId},
    summationType: {$eq: UsageSummationType.Two},
  };

  if (data.query?.fromDate || data.query?.toDate) {
    query.createdAt = {
      $gte: data.query?.fromDate
        ? getTimestamp(startOfMonth(data.query.fromDate))
        : undefined,
      $lte: data.query?.toDate ? getTimestamp(endOfMonth(data.query.toDate)) : undefined,
    };
  }

  if (data.query?.category) {
    // TODO: correct type
    query.category = {$in: toArray(data.query.category) as any[]};
  }

  // don't include the fulfillment status if it's undecided
  if (data.query?.fulfillmentStatus) {
    query.fulfillmentStatus = {
      // TODO: correct type
      $in: toArray(data.query.fulfillmentStatus) as any[],
    };
  } else {
    query.fulfillmentStatus = {
      $in: [
        UsageRecordFulfillmentStatus.Fulfilled,
        UsageRecordFulfillmentStatus.Dropped,
      ] as any[],
    };
  }

  return {query};
}
