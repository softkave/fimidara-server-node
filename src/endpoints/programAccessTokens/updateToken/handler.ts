import {omit} from 'lodash';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {checkProgramTokenNameExists} from '../checkProgramNameExists';
import ProgramAccessTokenQueries from '../queries';
import {checkProgramAccessTokenAuthorization02, getPublicProgramToken} from '../utils';
import {UpdateProgramAccessTokenEndpoint} from './types';
import {updateProgramAccessTokenJoiSchema} from './validation';

const updateProgramAccessToken: UpdateProgramAccessTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(agent, data.tokenId, data.onReferenced);

  const checkResult = await checkProgramAccessTokenAuthorization02(context, agent, tokenId, BasicCRUDActions.Read);

  const workspace = checkResult.workspace;
  let token = checkResult.token;
  const tokenUpdate: Partial<IProgramAccessToken> = {
    ...omit(data.token, 'permissionGroups'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  if (tokenUpdate.name && tokenUpdate.name !== token.name) {
    await checkProgramTokenNameExists(context, workspace.resourceId, tokenUpdate.name);
  }

  token = await context.data.programAccessToken.assertGetAndUpdateOneByQuery(
    ProgramAccessTokenQueries.getById(tokenId),
    tokenUpdate
  );

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    AppResourceType.ProgramAccessToken,
    data.token
  );

  token = await populateAssignedPermissionGroupsAndTags(
    context,
    token.workspaceId,
    token,
    AppResourceType.ProgramAccessToken
  );

  return {
    token: getPublicProgramToken(context, token),
  };
};

export default updateProgramAccessToken;
