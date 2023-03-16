import {BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {
  IUsageRecord,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../../definitions/usageRecord';
import {getDate} from '../../../utils/dateFns';
import {DataQuerySort, IUsageRecordQuery, LiteralDataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils';
import {IGetWorkspaceSummedUsageEndpointParams} from './types';

export async function getWorkspaceSummedUsageQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  data: IGetWorkspaceSummedUsageEndpointParams
) {
  await checkWorkspaceAuthorization02(context, agent, BasicCRUDActions.Read, workspaceId);

  let fromMonth = undefined;
  let toMonth = undefined;
  let fromYear = undefined;
  let toYear = undefined;
  const query: LiteralDataQuery<IUsageRecord> = {
    workspaceId: {$eq: workspaceId},
    summationType: {$eq: UsageSummationType.Two},
  };

  if (data.query?.fromDate) {
    const fromDate = getDate(data.query.fromDate);
    fromMonth = fromDate.getMonth();
    fromYear = fromDate.getFullYear();
  }
  if (data.query?.toDate) {
    const toDate = getDate(data.query.toDate);
    toMonth = toDate.getMonth();
    toYear = toDate.getFullYear();
  }
  if (fromMonth && toMonth) {
    query.month = {$gte: fromMonth, $lte: toMonth};
  }
  if (fromYear && toYear) {
    query.year = {$gte: fromYear, $lte: toYear};
  }
  if (data.query?.category) {
    // TODO: correct type
    query.category = data.query.category as any;
  }

  // don't include the fulfillment status if it's undecided
  if (data.query?.fulfillmentStatus) {
    query.fulfillmentStatus = {
      // TODO: correct type
      $eq: data.query.fulfillmentStatus as any,
    };
  } else {
    query.fulfillmentStatus = {
      $in: [UsageRecordFulfillmentStatus.Fulfilled, UsageRecordFulfillmentStatus.Dropped],
    };
  }

  const sort: DataQuerySort<IUsageRecordQuery> = {createdAt: 'desc'};
  return {query, sort};
}
