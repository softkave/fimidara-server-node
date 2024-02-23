import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {pathSplit} from '../../../utils/fns';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FileBackendMountQuery} from '../../contexts/data/types';
import {FolderQueries} from '../../folders/queries';
import EndpointReusableQueries from '../../queries';
import {getWorkspaceResourceListQuery01} from '../../utils';
import {GetFileBackendMountsEndpointParamsBase} from './types';

export async function getFileBackendMountsQuery(
  agent: SessionAgent,
  workspace: Workspace,
  other: Pick<
    GetFileBackendMountsEndpointParamsBase,
    'backend' | 'folderpath' | 'configId'
  >
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'readFileBackendMount', targetId: workspace.resourceId},
  });
  let query: FileBackendMountQuery = getWorkspaceResourceListQuery01(workspace, report);

  if (other.backend) {
    query.backend = other.backend;
  }

  if (other.folderpath) {
    const folderpathSplit = pathSplit(other.folderpath);
    query = EndpointReusableQueries.merge(
      query,
      FolderQueries.getByNamepathOnly({namepath: folderpathSplit})
    );
  }

  if (other.configId) {
    query.configId = other.configId;
  }

  return query;
}
