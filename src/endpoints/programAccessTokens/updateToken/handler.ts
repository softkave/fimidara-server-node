import {omit} from 'lodash';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {BasicCRUDActions} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent, getProgramAccessTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkProgramTokenNameExists} from '../checkProgramNameExists';
import {checkProgramAccessTokenAuthorization02, getPublicProgramToken} from '../utils';
import {UpdateProgramAccessTokenEndpoint} from './types';
import {updateProgramAccessTokenJoiSchema} from './validation';

const updateProgramAccessToken: UpdateProgramAccessTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(agent, data.tokenId, data.onReferenced);
  let {workspace, token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  const tokenUpdate: Partial<IProgramAccessToken> = {
    ...omit(data.token, 'permissionGroups'),
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  if (tokenUpdate.name && tokenUpdate.name !== token.name) {
    await checkProgramTokenNameExists(context, workspace.resourceId, tokenUpdate.name);
  }

  token = await context.semantic.programAccessToken.getAndUpdateOneById(tokenId, tokenUpdate);
  await saveResourceAssignedItems(context, agent, workspace, token.resourceId, data.token);
  token = await populateAssignedTags(context, token.workspaceId, token);
  return {
    token: getPublicProgramToken(context, token!),
  };
};

export default updateProgramAccessToken;
