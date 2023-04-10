import {endOfMonth, startOfMonth} from 'date-fns';
import {AppActionType, ISessionAgent} from '../../../definitions/system';
import {
  IUsageRecord,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getTimestamp} from '../../../utils/dateFns';
import {toArray} from '../../../utils/fns';
import {LiteralDataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils';
import {IGetWorkspaceSummedUsageEndpointParams} from './types';

export async function getWorkspaceSummedUsageQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  data: IGetWorkspaceSummedUsageEndpointParams
) {
  await checkWorkspaceAuthorization02(context, agent, AppActionType.Read, workspaceId);

  const query: LiteralDataQuery<IUsageRecord> = {
    workspaceId: {$eq: workspaceId},
    summationType: {$eq: UsageSummationType.Two},
  };

  if (data.query?.fromDate || data.query?.toDate) {
    query.createdAt = {
      $gte: data.query?.fromDate ? getTimestamp(startOfMonth(data.query.fromDate)) : undefined,
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
      $in: [UsageRecordFulfillmentStatus.Fulfilled, UsageRecordFulfillmentStatus.Dropped] as any[],
    };
  }

  return {query};
}
