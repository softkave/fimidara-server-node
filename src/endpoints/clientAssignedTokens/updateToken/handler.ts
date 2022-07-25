import {omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDate} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import {checkClientTokenNameExists} from '../checkClientTokenNameExists';
import {
  checkClientAssignedTokenAuthorization03,
  getPublicClientToken,
} from '../utils';
import {UpdateClientAssignedTokenEndpoint} from './types';
import {updateClientAssignedTokenPermissionGroupsJoiSchema} from './validation';

const updateClientAssignedToken: UpdateClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    updateClientAssignedTokenPermissionGroupsJoiSchema
  );

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
    await checkClientTokenNameExists(
      context,
      workspace.resourceId,
      data.token.name
    );
  }

  const update: Partial<IClientAssignedToken> = {
    ...omit(data.token, 'permissionGroups', 'tags'),
    lastUpdatedAt: getDate(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  token = await context.data.clientAssignedToken.assertUpdateItem(
    EndpointReusableQueries.getById(token.resourceId),
    update
  );

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    AppResourceType.ClientAssignedToken,
    data.token
  );

  const tokenWithAssignedItems = await populateAssignedPermissionGroupsAndTags(
    context,
    token.workspaceId,
    token,
    AppResourceType.ClientAssignedToken
  );

  return {
    token: getPublicClientToken(context, tokenWithAssignedItems),
  };
};

export default updateClientAssignedToken;
