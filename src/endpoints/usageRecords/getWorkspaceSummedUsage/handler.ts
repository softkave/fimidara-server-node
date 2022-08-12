import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceAuthorization02} from '../../workspaces/utils';
import {GetWorkspaceSummedUsageEndpoint} from './types';
import {getWorkspaceSummedUsageJoiSchema} from './validation';

const getWorkspaceSummedUsage: GetWorkspaceSummedUsageEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceSummedUsageJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  await checkWorkspaceAuthorization02(
    context,
    agent,
    workspaceId,
    BasicCRUDActions.Read
  );

  data.workspaceId = workspaceId;
  const records =
    await context.dataProviders.usageRecord.getWorkspaceSummedUsage(data);

  return {
    records,
  };
};

export default getWorkspaceSummedUsage;
