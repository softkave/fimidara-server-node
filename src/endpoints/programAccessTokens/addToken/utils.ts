import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {
  ISaveResourceAssignedItemsOptions,
  saveResourceAssignedItems,
} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {checkProgramTokenNameExists} from '../checkProgramNameExists';
import {programAccessTokenConstants} from '../constants';
import {INewProgramAccessTokenInput} from './types';

/**
 * Creates a new program access token. Does not check authorization.
 */
export const internalCreateProgramAccessToken = async (
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  data: INewProgramAccessTokenInput,
  assignedItemsOptions?: ISaveResourceAssignedItemsOptions
) => {
  await checkProgramTokenNameExists(context, workspace.resourceId, data.name);
  const secretKey = generateSecretKey();
  const hash = await argon2.hash(secretKey);
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  let token: IProgramAccessToken =
    await context.data.programAccessToken.saveItem({
      ...data,
      createdAt,
      createdBy,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: createdBy,
      hash,
      workspaceId: workspace.resourceId,
      resourceId: getNewId(),
    });

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    AppResourceType.ProgramAccessToken,
    data,
    /* deleteExisting */ false,
    /* options */ assignedItemsOptions
  );

  token = await populateAssignedPermissionGroupsAndTags(
    context,
    token.workspaceId,
    token,
    AppResourceType.ProgramAccessToken
  );

  return token;
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
