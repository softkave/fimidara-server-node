import {BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {UsageRecordFulfillmentStatus, UsageSummationType} from '../../../definitions/usageRecord';
import {getDate} from '../../../utils/dateFns';
import {DataQuerySort} from '../../contexts/data/types';
import {IUsageRecordQuery} from '../../contexts/data/usageRecord/type';
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
  const query: IUsageRecordQuery = {
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
      $ne: UsageRecordFulfillmentStatus.Undecided,
    };
  } else {
    query.fulfillmentStatus = {
      $ne: UsageRecordFulfillmentStatus.Undecided,
    };
  }

  const sort: DataQuerySort<IUsageRecordQuery> = {createdAt: 'desc'};
  return {query, sort};
}
