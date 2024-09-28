import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {FileBackendMountQuery} from '../../../contexts/data/types.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {pathSplit} from '../../../utils/fns.js';
import {FolderQueries} from '../../folders/queries.js';
import EndpointReusableQueries from '../../queries.js';
import {getWorkspaceResourceListQuery01} from '../../utils.js';
import {GetFileBackendMountsEndpointParamsBase} from './types.js';

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
  let query: FileBackendMountQuery = getWorkspaceResourceListQuery01(
    workspace,
    report
  );

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
