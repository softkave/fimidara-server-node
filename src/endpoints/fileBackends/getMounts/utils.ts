import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FileBackendMountQuery} from '../../contexts/data/types';
import {kFolderConstants} from '../../folders/constants';
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
  const query: FileBackendMountQuery = getWorkspaceResourceListQuery01(workspace, report);

  if (other.backend) {
    query.backend = other.backend;
  }

  if (other.folderpath) {
    const folderpathSplit = other.folderpath.split(kFolderConstants.separator);
    query.namepath = {$all: folderpathSplit, $size: folderpathSplit.length};
  }

  if (other.configId) {
    query.configId = other.configId;
  }

  return query;
}
