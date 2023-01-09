import {BasicCRUDActions} from '../../../definitions/system';
import {UsageRecordFulfillmentStatus, UsageSummationType} from '../../../definitions/usageRecord';
import {getDate} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {IUsageRecordQuery} from '../../contexts/data/usagerecord/type';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils';
import {GetWorkspaceSummedUsageEndpoint} from './types';
import {getWorkspaceSummedUsageJoiSchema} from './validation';

const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceSummedUsageJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  await checkWorkspaceAuthorization02(context, agent, workspaceId, BasicCRUDActions.Read);

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

  const records = await context.data.usageRecord.getManyByQuery(query, {sort: {createdAt: 'desc'}});
  return {
    records,
  };
};

export default getWorkspaceSummedUsage;
