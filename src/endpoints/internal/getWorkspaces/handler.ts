import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {workspaceListExtractor} from '../../workspaces/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetWorkspacesEndpoint} from './types';

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
