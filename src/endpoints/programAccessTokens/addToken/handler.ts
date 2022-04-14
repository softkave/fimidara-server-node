import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {programAccessTokenConstants} from '../constants';
import {getPublicProgramToken} from '../utils';
import {AddProgramAccessTokenEndpoint} from './types';
import {addProgramAccessTokenJoiSchema} from './validation';
import {checkProgramTokenNameExists} from '../checkProgramNameExists';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {getWorkspaceId} from '../../contexts/SessionContext';

const addProgramAccessToken: AddProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.ProgramAccessToken,
    permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkProgramTokenNameExists(
    context,
    workspace.resourceId,
    data.token.name
  );

  const secretKey = generateSecretKey();
  const hash = await argon2.hash(secretKey);
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  let token: IProgramAccessToken =
    await context.data.programAccessToken.saveItem({
      ...data.token,
      createdAt,
      createdBy,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: createdBy,
      hash,
      workspaceId: workspaceId,
      resourceId: getNewId(),
    });

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    AppResourceType.ProgramAccessToken,
    data.token
  );

  token = await withAssignedPresetsAndTags(
    context,
    token.workspaceId,
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
    throw new ServerError('Error generating secret key');
  }
}

export default addProgramAccessToken;
