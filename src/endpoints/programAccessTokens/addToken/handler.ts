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
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {programAccessTokenConstants} from '../constants';
import {getPublicProgramToken} from '../utils';
import {AddProgramAccessTokenEndpoint} from './types';
import {addProgramAccessTokenJoiSchema} from './validation';
import {checkProgramTokenNameExists} from '../checkProgramNameExists';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';

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

  await checkAuthorization({
    context,
    agent,
    organization,
    type: AppResourceType.ProgramAccessToken,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkProgramTokenNameExists(
    context,
    organization.resourceId,
    data.token.name
  );

  const secretKey = generateSecretKey();
  const hash = await argon2.hash(secretKey);
  let token: IProgramAccessToken =
    await context.data.programAccessToken.saveItem({
      ...data.token,
      hash,
      organizationId: data.organizationId,
      resourceId: getNewId(),
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    });

  await saveResourceAssignedItems(
    context,
    agent,
    organization,
    token.resourceId,
    AppResourceType.ProgramAccessToken,
    data.token
  );

  token = await withAssignedPresetsAndTags(
    context,
    token.organizationId,
    token,
    AppResourceType.ProgramAccessToken
  );

  return {
    token: getPublicProgramToken(context, token),
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
