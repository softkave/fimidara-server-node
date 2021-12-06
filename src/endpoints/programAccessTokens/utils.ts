import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {assignedPresetsListExtractor} from '../presetPermissionsGroup/utils';
import {agentExtractor} from '../utils';
import ProgramAccessTokenQueries from './queries';
import {IPublicProgramAccessToken} from './types';

const programAccessTokenFields = getFields<IPublicProgramAccessToken>({
  tokenId: true,
  hash: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  organizationId: true,
  description: true,
  presets: assignedPresetsListExtractor,
});

export const programAccessTokenExtractor = makeExtract(
  programAccessTokenFields
);

export const programAccessTokenListExtractor = makeListExtract(
  programAccessTokenFields
);

export async function checkProgramAccessTokenAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  token: IProgramAccessToken,
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
    organization.organizationId,
    token.tokenId,
    AppResourceType.ProgramAccessToken,
    makeBasePermissionOwnerList(organization.organizationId),
    action,
    nothrow
  );

  return {agent, token, organization};
}

export async function checkProgramAccessTokenAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const token = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(id)
  );

  return checkProgramAccessTokenAuthorization(
    context,
    agent,
    token,
    action,
    nothrow
  );
}

export function throwProgramAccessTokenNotFound() {
  throw new NotFoundError('Program access token not found');
}

export abstract class ProgramAccessTokenUtils {
  static extractPublicToken = programAccessTokenExtractor;
  static extractPublicTokenList = programAccessTokenListExtractor;
}
