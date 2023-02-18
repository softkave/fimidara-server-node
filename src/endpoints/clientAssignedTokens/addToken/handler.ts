import {defaultTo, omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  BasicCRUDActions,
  CURRENT_TOKEN_VERSION,
  IAgent,
} from '../../../definitions/system';
import {getDate} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import EndpointReusableQueries from '../../queries';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {checkClientTokenNameExists} from '../checkClientTokenNameExists';
import {getPublicClientToken} from '../utils';
import {AddClientAssignedTokenEndpoint} from './types';
import {addClientAssignedTokenJoiSchema} from './validation';

const addClientAssignedToken: AddClientAssignedTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.ClientAssignedToken,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  let token: IClientAssignedToken | null = null;
  if (data.token.name) {
    await checkClientTokenNameExists(context, workspace.resourceId, data.token.name);
  }

  if (data.token.providedResourceId) {
    token = await context.data.clientAssignedToken.getOneByQuery(
      EndpointReusableQueries.getByProvidedId(workspace.resourceId, data.token.providedResourceId)
    );
  }

  if (!token) {
    const createdAt = getDate();
    const createdBy: IAgent = {
      agentId: agent.agentId,
      agentType: agent.agentType,
    };

    token = {
      ...omit(data.token, 'permissionGroups', 'tags'),
      createdAt,
      createdBy,
      providedResourceId: defaultTo(data.token.providedResourceId, null),
      workspaceId: workspace.resourceId,
      resourceId: getNewIdForResource(AppResourceType.ClientAssignedToken),
      version: CURRENT_TOKEN_VERSION,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: createdBy,
    };
    await context.data.clientAssignedToken.insertItem(token);
  } else {
    token = await context.data.clientAssignedToken.assertGetAndUpdateOneByQuery(
      EndpointReusableQueries.getByResourceId(token.resourceId),
      {
        ...omit(data.token, 'permissionGroups', 'tags'),
        lastUpdatedAt: getDate(),
        lastUpdatedBy: {agentId: agent.agentId, agentType: agent.agentType},
      }
    );
  }

  await saveResourceAssignedItems(context, agent, workspace, token.resourceId, data.token);
  const tokenWithAssignedItems = await populateAssignedTags(context, token.workspaceId, token);
  return {token: getPublicClientToken(context, tokenWithAssignedItems)};
};

export default addClientAssignedToken;
