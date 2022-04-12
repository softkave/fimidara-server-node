import {omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDate, getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {
  CURRENT_TOKEN_VERSION,
  getOrganizationId,
} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
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
  const organizationId = getOrganizationId(agent, data.organizationId);
  const organization = await checkOrganizationExists(context, organizationId);
  await checkAuthorization({
    context,
    agent,
    organization,
    type: AppResourceType.ClientAssignedToken,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    action: BasicCRUDActions.Create,
  });

  let token: IClientAssignedToken | null = null;

  if (data.token.name) {
    await checkClientTokenNameExists(
      context,
      organization.resourceId,
      data.token.name
    );
  }

  if (data.token.providedResourceId) {
    token = await context.data.clientAssignedToken.getItem(
      EndpointReusableQueries.getByProvidedId(
        organization.resourceId,
        data.token.providedResourceId
      )
    );
  }

  if (!token) {
    token = await context.data.clientAssignedToken.saveItem({
      ...omit(data.token, 'presets', 'tags'),
      organizationId: organization.resourceId,
      resourceId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
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
    organization,
    token.resourceId,
    AppResourceType.ClientAssignedToken,
    data.token
  );

  token = await withAssignedPresetsAndTags(
    context,
    token.organizationId,
    token,
    AppResourceType.ClientAssignedToken
  );

  return {
    token: getPublicClientToken(context, token),
  };
};

export default addClientAssignedToken;
