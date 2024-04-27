import {appAssert} from '../../../utils/assertion';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenAuthorization02, getPublicAgentToken} from '../utils';
import {GetAgentTokenEndpoint} from './types';
import {getAgentTokenJoiSchema} from './validation';

const getAgentToken: GetAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, getAgentTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  let {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    'readAgentToken'
  );
  appAssert(token.workspaceId);
  token = await populateAssignedTags(token.workspaceId, token);
  return {token: getPublicAgentToken(token)};
};

export default getAgentToken;
