import {AppResourceTypeMap} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenAuthorization02} from '../utils';
import {DeleteAgentTokenEndpoint} from './types';
import {deleteAgentTokenJoiSchema} from './validation';

const deleteAgentToken: DeleteAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const {token} = await checkAgentTokenAuthorization02(
    context,
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    'deleteAgentToken'
  );
  const workspaceId = token.workspaceId;
  appAssert(workspaceId);

  const job = await enqueueDeleteResourceJob({
    type: AppResourceTypeMap.AgentToken,
    args: {workspaceId, resourceId: token.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteAgentToken;
