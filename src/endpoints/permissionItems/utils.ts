import {IFile} from '../../definitions/file';
import {IPermissionItem, IPublicPermissionItem} from '../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
  IPublicAccessOpInput,
  IResourceBase,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {makeKey} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {reuseableErrors} from '../../utils/reusableErrors';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {workspaceResourceFields} from '../utils';
import {INewPermissionItemInput} from './addItems/types';
import {internalAddPermissionItems} from './addItems/utils';

const permissionItemFields = getFields<IPublicPermissionItem>({
  ...workspaceResourceFields,
  containerId: true,
  containerType: true,
  entityId: true,
  entityType: true,
  targetId: true,
  targetType: true,
  action: true,
  grantAccess: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);
export const permissionItemListExtractor = makeListExtract(permissionItemFields);

export function throwPermissionItemNotFound() {
  throw reuseableErrors.permissionItem.notFound();
}

export const publicAccessOpComparator = (item01: IPublicAccessOp, item02: IPublicAccessOp) =>
  item01.action === item02.action && item01.resourceType === item02.resourceType;

export function getPublicAccessOpArtifactsFromResource(
  resource: Pick<IResourceBase, 'resourceId'> & Pick<IFile, 'folderId' | 'workspaceId'>
) {
  const type = getResourceTypeFromId(resource.resourceId);

  // Choose closest container which'll be the containing folder or workspace for
  // root-level files and folders
  const containerId = resource.parentId ?? resource.workspaceId;
  const containerType = resource.parentId ? AppResourceType.Folder : AppResourceType.Workspace;

  // File public access ops should have target ID because the op targets a
  // single file, but folder public access ops are blanket permissions. Scoping
  // is done with `appliesTo` which limits the permissions granted to the
  // container, or the container and it's children, or just it's children.
  const targetId = type === AppResourceType.File ? resource.resourceId : undefined;
  return {containerId, containerType, targetId};
}

export function makePermissionItemInputsFromPublicAccessOps(
  ops: IPublicAccessOpInput[],
  resource: Pick<IResourceBase, 'resourceId'> & Pick<IFile, 'folderId' | 'workspaceId'>,
  grantAccess = true
): INewPermissionItemInput[] {
  const {targetId} = getPublicAccessOpArtifactsFromResource(resource);
  return ops.map(op => ({
    targetId,
    grantAccess,
    action: op.action,
    targetType: op.resourceType,
  }));
}

export async function replacePublicPermissionGroupAccessOps(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  addOps: IPublicAccessOp[],
  resource: IResourceBase & Pick<IFile, 'folderId' | 'workspaceId'>
) {
  if (workspace.publicPermissionGroupId) {
    await internalAddPermissionItems(context, agent, workspace.resourceId, {
      workspaceId: workspace.resourceId,
      entityId: workspace.publicPermissionGroupId,
      items: makePermissionItemInputsFromPublicAccessOps(addOps, resource),
    });
  }
}

export interface IPermissionItemBase {
  containerId: string;
  targetId?: string;
  targetType: AppResourceType;
  entityId: string;
  action: BasicCRUDActions;
  grantAccess?: boolean;
  isForPermissionContainer?: boolean;
}

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}

export function getTargetType(data: {targetId?: string; targetType?: AppResourceType}) {
  const targetType = data.targetType
    ? data.targetType
    : data.targetId
    ? getResourceTypeFromId(data.targetId)
    : null;
  appAssert(targetType, new InvalidRequestError('Target ID or target type must be present'));
  return targetType;
}

export const permissionItemIndexer = (item: IPermissionItemBase) => {
  return makeKey([
    item.entityId,
    item.containerId,
    item.targetId,
    item.targetType,
    item.action,
    item.grantAccess,
    item.isForPermissionContainer,
  ]);
};

export const newPermissionItemInputIndexer = (item: INewPermissionItemInput) => {
  return makeKey([item.targetId, item.targetType, item.action, item.grantAccess]);
};

export function assertPermissionItem(item?: IPermissionItem | null): asserts item {
  appAssert(item, reuseableErrors.permissionItem.notFound());
}
