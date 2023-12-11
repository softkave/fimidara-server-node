import {AppResourceTypeMap} from '../../../definitions/system';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {workspaceListExtractor} from '../../workspaces/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetWorkspacesEndpoint} from './types';

const getWorkspaces: GetWorkspacesEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, [AppResourceTypeMap.User]);
  await assertUserIsPartOfRootWorkspace(agent);
  const workspaceList = await kSemanticModels.workspace().getManyByQuery({});
  return {workspaceList: workspaceListExtractor(workspaceList)};
};

export default getWorkspaces;
