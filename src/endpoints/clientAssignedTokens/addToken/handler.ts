import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
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
      expires: data.token.expires,
      organizationId: organization.resourceId,
      resourceId: getNewId(),
      providedResourceId: data.token.providedResourceId,
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
    });
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
