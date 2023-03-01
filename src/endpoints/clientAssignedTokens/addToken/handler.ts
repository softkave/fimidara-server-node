import {defaultTo, omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  BasicCRUDActions,
  CURRENT_TOKEN_VERSION,
} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkAuthorization} from '../../contexts/authorization-checks/checkAuthorizaton';
import EndpointReusableQueries from '../../queries';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {checkClientTokenNameExists} from '../checkClientTokenNameExists';
import {assertClientToken, getPublicClientToken} from '../utils';
import {AddClientAssignedTokenEndpoint} from './types';
import {addClientAssignedTokenJoiSchema} from './validation';

const addClientAssignedToken: AddClientAssignedTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: [{type: AppResourceType.ClientAssignedToken}],
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
    token = newResource(agent, AppResourceType.ClientAssignedToken, {
      ...omit(data.token, 'tags'),
      providedResourceId: defaultTo(data.token.providedResourceId, null),
      version: CURRENT_TOKEN_VERSION,
      workspaceId: workspace.resourceId,
    });
    await context.semantic.clientAssignedToken.insertItem(token);
  } else {
    token = await context.semantic.clientAssignedToken.getAndUpdateOneById(token.resourceId, {
      ...omit(data.token, 'tags'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    });
  }

  assertClientToken(token);
  await saveResourceAssignedItems(context, agent, workspace, token.resourceId, data.token);
  const tokenWithAssignedItems = await populateAssignedTags(context, token.workspaceId, token);
  return {token: getPublicClientToken(context, tokenWithAssignedItems)};
};

export default addClientAssignedToken;
