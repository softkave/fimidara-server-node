import {defaultTo, omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {getDate, getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {
  CURRENT_TOKEN_VERSION,
  getWorkspaceId,
} from '../../contexts/SessionContext';
import {checkWorkspaceExists} from '../../workspaces/utils';
import EndpointReusableQueries from '../../queries';
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
      ...omit(data.token, 'presets', 'tags'),
      createdAt,
      createdBy,
      providedResourceId: defaultTo(data.token.providedResourceId, null),
      workspaceId: workspace.resourceId,
      resourceId: getNewId(),
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
      lastUpdatedAt: createdAt,
      lastUpdatedBy: createdBy,
    });
  } else {
    token = await context.data.clientAssignedToken.assertUpdateItem(
      EndpointReusableQueries.getById(token.resourceId),
      {
        ...omit(data.token, 'presets', 'tags'),
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

  token = await withAssignedPresetsAndTags(
    context,
    token.workspaceId,
    token,
    AppResourceType.ClientAssignedToken
  );

  return {
    token: getPublicClientToken(context, token),
  };
};

export default addClientAssignedToken;
