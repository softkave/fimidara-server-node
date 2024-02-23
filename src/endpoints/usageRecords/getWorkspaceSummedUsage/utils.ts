import {endOfMonth, startOfMonth} from 'date-fns';
import {SessionAgent} from '../../../definitions/system';
import {
  UsageRecord,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../../definitions/usageRecord';
import {getTimestamp} from '../../../utils/dateFns';
import {convertToArray} from '../../../utils/fns';
import {LiteralDataQuery} from '../../contexts/data/types';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils';
import {GetWorkspaceSummedUsageEndpointParams} from './types';

export async function getWorkspaceSummedUsageQuery(
  agent: SessionAgent,
  workspaceId: string,
  data: GetWorkspaceSummedUsageEndpointParams
) {
  // TODO: should we include permissions check for usage records?
  await checkWorkspaceAuthorization02(agent, 'readUsageRecord', workspaceId);

  const query: LiteralDataQuery<UsageRecord> = {
    workspaceId: {$eq: workspaceId},
    summationType: {$eq: UsageSummationTypeMap.Month},
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
    // @ts-ignore
    query.category = {$in: convertToArray(data.query.category)};
  }

  // don't include the fulfillment status if it's undecided
  if (data.query?.fulfillmentStatus) {
    query.fulfillmentStatus = {
      // @ts-ignore
      $in: convertToArray(data.query.fulfillmentStatus),
    };
  } else {
    query.fulfillmentStatus = {
      $in: [
        // @ts-ignore
        UsageRecordFulfillmentStatusMap.Fulfilled,
        UsageRecordFulfillmentStatusMap.Dropped,
      ],
    };
  }

  return {query};
}
