import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {workspaceListExtractor} from '../../workspaces/utils.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {GetWorkspacesEndpoint} from './types.js';

const getWorkspaces: GetWorkspacesEndpoint = async reqData => {
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  await assertUserIsPartOfRootWorkspace(agent);
  const workspaceList = await kIjxSemantic.workspace().getManyByQuery({});
  return {workspaceList: workspaceListExtractor(workspaceList)};
};

export default getWorkspaces;
