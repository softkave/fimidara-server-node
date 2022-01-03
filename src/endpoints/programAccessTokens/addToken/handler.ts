import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {TokenType} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
import {programAccessTokenConstants} from '../constants';
import {ProgramAccessTokenUtils} from '../utils';
import {AddProgramAccessTokenEndpoint} from './types';
import {addProgramAccessTokenJoiSchema} from './validation';
import EndpointReusableQueries from '../../queries';
import {ResourceExistsError} from '../../errors';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';

/**
 * addProgramAccessToken.
 * Creates a program access token.
 *
 * Ensure that:
 * - Auth check
 * - Check that presets exist
 * - Token and secret key is generated
 * - Return token and encoded token string
 */

const addProgramAccessToken: AddProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    null,
    AppResourceType.ProgramAccessToken,
    makeBasePermissionOwnerList(organization.organizationId),
    BasicCRUDActions.Create
  );

  const itemExists = await context.data.programAccessToken.checkItemExists(
    EndpointReusableQueries.getByOrganizationAndName(
      organization.organizationId,
      data.token.name
    )
  );

  if (itemExists) {
    throw new ResourceExistsError('Program access token exists');
  }

  await checkPresetsExist(
    context,
    agent,
    organization.organizationId,
    data.token.presets
  );

  const secretKey = generateSecretKey();
  const hash = await argon2.hash(secretKey);
  const token: IProgramAccessToken = await context.data.programAccessToken.saveItem(
    {
      ...data.token,
      hash,
      organizationId: data.organizationId,
      tokenId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      presets: data.token.presets.map(item => ({
        ...item,
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      })),
    }
  );

  return {
    token: ProgramAccessTokenUtils.extractPublicToken(token),
    tokenStr: context.session.encodeToken(
      context,
      token.tokenId,
      TokenType.ProgramAccessToken
    ),
  };
};

function generateSecretKey() {
  try {
    const key = crypto
      .randomBytes(programAccessTokenConstants.tokenSecretKeyLength)
      .toString('hex');
    return key;
  } catch (error) {
    console.error(error);
    throw new ServerError();
  }
}

export default addProgramAccessToken;
