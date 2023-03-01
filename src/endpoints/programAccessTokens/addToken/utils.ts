import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, IAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
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
  data: INewProgramAccessTokenInput
) => {
  await checkProgramTokenNameExists(context, workspace.resourceId, data.name);
  const secretKey = generateSecretKey();
  const hash = await argon2.hash(secretKey);
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };
  let token: IProgramAccessToken = await context.semantic.programAccessToken.insertItem({
    ...data,
    createdAt,
    createdBy,
    hash,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    workspaceId: workspace.resourceId,
    resourceId: getNewIdForResource(AppResourceType.ProgramAccessToken),
  });
  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    data,
    /* deleteExisting */ false
  );
  token = await populateAssignedTags(context, token.workspaceId, token);
  return token;
};

function generateSecretKey() {
  const key = crypto.randomBytes(programAccessTokenConstants.tokenSecretKeyLength).toString('hex');
  return key;
}
