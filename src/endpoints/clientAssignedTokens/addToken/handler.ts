import {add} from 'date-fns';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IAppVariables} from '../../../resources/appVariables';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {
  IBaseContext,
  IBaseContextDataProviders,
} from '../../contexts/BaseContext';
import {IEmailProviderContext} from '../../contexts/EmailProviderContext';
import {IFilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';
import {
  CURRENT_TOKEN_VERSION,
  getOrganizationId,
  TokenType,
} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../../queries';
import {ClientAssignedTokenUtils} from '../utils';
import {AddClientAssignedTokenEndpoint} from './types';
import {addClientAssignedTokenJoiSchema} from './validation';

/**
 * addClientAssignedToken.
 * Updates a collaboration request.
 *
 * Ensure that:
 * - Auth check
 * - Check that presets exist
 * - Create token and return token and encoded token
 */

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
    const presets = data.token.presets || [];

    if (presets.length > 0) {
      await checkPresetsExist(context, agent, organization, presets);
    }

    token = await context.data.clientAssignedToken.saveItem({
      expires:
        data.token.expires &&
        add(Date.now(), {seconds: data.token.expires}).valueOf(),
      organizationId: organization.resourceId,
      resourceId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      version: CURRENT_TOKEN_VERSION,
      issuedAt: getDateString(),
      presets: presets.map(item => ({
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        order: item.order,
        presetId: item.presetId,
      })),
    });
  }

  return toAddTokenResult(token, context);
};

export default addClientAssignedToken;
function toAddTokenResult(
  token: IClientAssignedToken,
  context: IBaseContext<
    IBaseContextDataProviders,
    IEmailProviderContext,
    IFilePersistenceProviderContext,
    IAppVariables
  >
):
  | (import('c:/Users/yword/Desktop/projects/files/files-server-node/src/endpoints/clientAssignedTokens/addToken/types').IAddClientAssignedTokenResult &
      import('c:/Users/yword/Desktop/projects/files/files-server-node/src/endpoints/types').IBaseEndpointResult)
  | PromiseLike<
      import('c:/Users/yword/Desktop/projects/files/files-server-node/src/endpoints/clientAssignedTokens/addToken/types').IAddClientAssignedTokenResult &
        import('c:/Users/yword/Desktop/projects/files/files-server-node/src/endpoints/types').IBaseEndpointResult
    > {
  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
    tokenStr: context.session.encodeToken(
      context,
      token.resourceId,
      TokenType.ClientAssignedToken,
      token.expires
    ),
  };
}
