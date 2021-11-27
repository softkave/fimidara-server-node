import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {ISessionAgent, BasicCRUDActions} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForProgramAccessToken} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
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
  action: BasicCRUDActions
) {
  const organization = await checkOrganizationExists(
    context,
    token.organizationId
  );

  await checkAuthorizationForProgramAccessToken(
    context,
    agent,
    organization.organizationId,
    token,
    action
  );

  return {agent, token, organization};
}

export async function checkProgramAccessTokenAuthorizationWithId(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions
) {
  const token = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(id)
  );

  return checkProgramAccessTokenAuthorization(context, agent, token, action);
}

export abstract class ProgramAccessTokenUtils {
  static extractPublicToken = programAccessTokenExtractor;
  static extractPublicTokenList = programAccessTokenListExtractor;
}
