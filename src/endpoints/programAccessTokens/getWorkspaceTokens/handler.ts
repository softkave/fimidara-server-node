import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {getEndpointPageFromInput, getWorkspaceFromEndpointInput} from '../../utils';
import {getPublicProgramToken} from '../utils';
import {GetWorkspaceProgramAccessTokenEndpoint} from './types';
import {getWorkspaceProgramAccessTokensQuery} from './utils';
import {getWorkspaceProgramAccessTokenJoiSchema} from './validation';

const getWorkspaceProgramAccessTokens: GetWorkspaceProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceProgramAccessTokensQuery(context, agent, workspace);
  let tokens = await context.data.programAccessToken.getManyByQuery(q, data);
  tokens = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    tokens,
    AppResourceType.ProgramAccessToken
  );
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicProgramToken(context, token)),
  };
};

export default getWorkspaceProgramAccessTokens;
