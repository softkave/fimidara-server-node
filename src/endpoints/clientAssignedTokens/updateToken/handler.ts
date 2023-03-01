import {omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {BasicCRUDActions} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkClientTokenNameExists} from '../checkClientTokenNameExists';
import {checkClientAssignedTokenAuthorization03, getPublicClientToken} from '../utils';
import {UpdateClientAssignedTokenEndpoint} from './types';
import {updateClientAssignedTokenJoiSchema} from './validation';

const updateClientAssignedToken: UpdateClientAssignedTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const checkResult = await checkClientAssignedTokenAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Update
  );
  const workspace = checkResult.workspace;
  let token = checkResult.token;
  if (data.token.name && data.token.name !== token.name) {
    await checkClientTokenNameExists(context, workspace.resourceId, data.token.name);
  }

  const update: Partial<IClientAssignedToken> = {
    ...omit(data.token, 'permissionGroups', 'tags'),
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };
  token = await context.semantic.clientAssignedToken.getAndUpdateOneById(token.resourceId, update);
  await saveResourceAssignedItems(context, agent, workspace, token.resourceId, data.token);
  const tokenWithAssignedItems = await populateAssignedTags(context, token.workspaceId, token);
  return {
    token: getPublicClientToken(context, tokenWithAssignedItems),
  };
};

export default updateClientAssignedToken;
