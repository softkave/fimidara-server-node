import {add} from 'date-fns';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {
  CURRENT_TOKEN_VERSION,
  getOrganizationId,
  TokenType,
} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
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
  await checkAuthorization(
    context,
    agent,
    organization.resourceId,
    null,
    AppResourceType.ClientAssignedToken,
    makeBasePermissionOwnerList(organization.resourceId),
    BasicCRUDActions.Create
  );

  await checkPresetsExist(
    context,
    agent,
    organization.resourceId,
    data.token.presets
  );

  const token: IClientAssignedToken = await context.data.clientAssignedToken.saveItem(
    {
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
      presets: data.token.presets.map(item => ({
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
        order: item.order,
        presetId: item.presetId,
      })),
    }
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
    tokenStr: context.session.encodeToken(
      context,
      token.resourceId,
      TokenType.ClientAssignedToken,
      token.expires
    ),
  };
};

export default addClientAssignedToken;
