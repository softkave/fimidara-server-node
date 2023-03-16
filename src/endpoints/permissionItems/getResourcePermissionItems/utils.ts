import {first} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {LiteralDataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {InvalidRequestError, NotFoundError} from '../../errors';
import {IResource} from '../../resources/types';
import {
  checkPermissionContainersExist,
  checkPermissionTargetsExist,
} from '../checkPermissionArtifacts';
import {IGetResourcePermissionItemsEndpointParamsBase} from './types';

export async function getResourcePermissionItemsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IGetResourcePermissionItemsEndpointParamsBase
) {
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Read,
    targets: {type: AppResourceType.PermissionItem},
  });
  appAssert(
    data.targetId || data.targetType,
    new InvalidRequestError('Provide target ID or target type.')
  );

  let target: IResource | undefined = undefined,
    containerId = data.containerId ?? workspace.resourceId,
    permissionContainer: IResource | undefined = undefined;

  if (data.targetId) {
    const targetsCheckResult = await checkPermissionTargetsExist(
      context,
      agent,
      workspace.resourceId,
      [data.targetId],
      BasicCRUDActions.Read
    );
    target = first(targetsCheckResult.resources);
    appAssert(target, new NotFoundError('Permission target not found.'));
  }

  if (containerId !== workspace.resourceId) {
    const containersCheckResult = await checkPermissionContainersExist(
      context,
      agent,
      workspace.resourceId,
      [containerId],
      BasicCRUDActions.Read
    );
    permissionContainer = first(containersCheckResult.resources);
    appAssert(permissionContainer, new NotFoundError('Permission container not found.'));
  }

  let containerIdList: string[] = [];
  if (
    target &&
    (target.resourceType === AppResourceType.File || target.resourceType === AppResourceType.Folder)
  ) {
    containerIdList = getFilePermissionContainers(
      workspace.resourceId,
      target.resource as unknown as Pick<IFile, 'idPath'>
    );
  } else if (
    permissionContainer &&
    (permissionContainer.resourceType === AppResourceType.File ||
      permissionContainer.resourceType === AppResourceType.Folder)
  ) {
    containerIdList = getFilePermissionContainers(
      workspace.resourceId,
      permissionContainer.resource as unknown as Pick<IFile, 'idPath'>
    );
  } else {
    containerIdList = getWorkspacePermissionContainers(workspace.resourceId);
  }

  const query: LiteralDataQuery<IPermissionItem> = {
    workspaceId: data.workspaceId,
    containerId: {$in: containerIdList},
    targetType: data.targetType
      ? {$in: [AppResourceType.All, data.targetType]}
      : {$eq: AppResourceType.All},
    targetId: data.targetId ? {$in: [data.targetId, null]} : null,
  };
  return query;
}
