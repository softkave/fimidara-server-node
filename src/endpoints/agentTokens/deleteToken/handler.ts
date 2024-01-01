import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenAuthorization02} from '../utils';
import {DeleteAgentTokenEndpoint} from './types';
import {deleteAgentTokenJoiSchema} from './validation';

const deleteAgentToken: DeleteAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, deleteAgentTokenJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    'deleteAgentToken'
  );
  const workspaceId = token.workspaceId;
  appAssert(workspaceId);

  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.AgentToken,
    args: {workspaceId, resourceId: token.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteAgentToken;
