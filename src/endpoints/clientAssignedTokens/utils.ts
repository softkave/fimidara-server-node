import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {assignedPresetsListExtractor} from '../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../queries';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {IPublicClientAssignedToken} from './types';

const clientAssignedTokenFields = getFields<IPublicClientAssignedToken>({
  resourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  organizationId: true,
  version: true,
  issuedAt: getDateString,
  expires: true,
  lastUpdatedAt: getDateStringIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
  presets: assignedPresetsListExtractor,
});

export const clientAssignedTokenExtractor = makeExtract(
  clientAssignedTokenFields
);

export const clientAssignedTokenListExtractor = makeListExtract(
  clientAssignedTokenFields
);

export async function checkClientAssignedTokenAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  token: IClientAssignedToken,
  action: BasicCRUDActions,
  nothrow = false
) {
  const organization = await checkOrganizationExists(
    context,
    token.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.resourceId,
    token.resourceId,
    AppResourceType.ClientAssignedToken,
    makeBasePermissionOwnerList(organization.resourceId),
    action,
    nothrow
  );

  return {agent, token, organization};
}

export async function checkClientAssignedTokenAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  tokenId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const token = await context.data.clientAssignedToken.assertGetItem(
    EndpointReusableQueries.getById(tokenId)
  );

  return checkClientAssignedTokenAuthorization(
    context,
    agent,
    token,
    action,
    nothrow
  );
}

export function throwClientAssignedTokenNotFound() {
  throw new NotFoundError('Client assigned token not found');
}

export abstract class ClientAssignedTokenUtils {
  static extractPublicToken = clientAssignedTokenExtractor;
  static extractPublicTokenList = clientAssignedTokenListExtractor;
}
