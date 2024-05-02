import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {workspaceListExtractor} from '../../workspaces/utils.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {GetWorkspacesEndpoint} from './types.js';

const getWorkspaces: GetWorkspacesEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  await assertUserIsPartOfRootWorkspace(agent);
  const workspaceList = await kSemanticModels.workspace().getManyByQuery({});
  return {workspaceList: workspaceListExtractor(workspaceList)};
};

export default getWorkspaces;
