import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {FileBackendMountQuery} from '../../../contexts/data/types.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {pathSplit} from '../../../utils/fns.js';
import {FolderQueries} from '../../folders/queries.js';
import EndpointReusableQueries from '../../queries.js';
import {getWorkspaceResourceByIdListQuery} from '../../utils.js';
import {GetFileBackendMountsEndpointParamsBase} from './types.js';

export async function getFileBackendMountsQuery(
  agent: SessionAgent,
  workspaceId: string,
  other: Pick<
    GetFileBackendMountsEndpointParamsBase,
    'backend' | 'folderpath' | 'configId'
  >
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspaceId,
    target: {
      action: kFimidaraPermissionActions.readFileBackendMount,
      targetId: workspaceId,
    },
  });
  let query: FileBackendMountQuery = getWorkspaceResourceByIdListQuery(
    workspaceId,
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
