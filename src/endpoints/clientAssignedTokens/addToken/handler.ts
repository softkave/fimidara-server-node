import {defaultTo, omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {getDate, getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {
  CURRENT_TOKEN_VERSION,
  getWorkspaceId,
} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {checkClientTokenNameExists} from '../checkClientTokenNameExists';
import {getPublicClientToken} from '../utils';
import {AddClientAssignedTokenEndpoint} from './types';
import {addClientAssignedTokenJoiSchema} from './validation';

const addClientAssignedToken: AddClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.ClientAssignedToken,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  let token: IClientAssignedToken | null = null;

  if (data.token.name) {
    await checkClientTokenNameExists(
      context,
      workspace.resourceId,
      data.token.name
    );
  }

  if (data.token.providedResourceId) {
    token = await context.data.clientAssignedToken.getItem(
      EndpointReusableQueries.getByProvidedId(
        workspace.resourceId,
        data.token.providedResourceId
      )
    );
  }

  if (!token) {
    const createdAt = getDate();
    const createdBy: IAgent = {
      agentId: agent.agentId,
      agentType: agent.agentType,
    };

    token = await context.data.clientAssignedToken.saveItem({
      ...omit(data.token, 'permissionGroups', 'tags'),
      createdAt,
      createdBy,
      providedResourceId: defaultTo(data.token.providedResourceId, null),
      workspaceId: workspace.resourceId,
      resourceId: getNewIdForResource(AppResourceType.ClientAssignedToken),
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
      lastUpdatedAt: createdAt,
      lastUpdatedBy: createdBy,
    });
  } else {
    token = await context.data.clientAssignedToken.assertUpdateItem(
      EndpointReusableQueries.getById(token.resourceId),
      {
        ...omit(data.token, 'permissionGroups', 'tags'),
        lastUpdatedAt: getDate(),
        lastUpdatedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      }
    );
  }

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

export default addClientAssignedToken;
