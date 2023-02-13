import {uniqWith} from 'lodash';
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
import {getDateString} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {makeKey} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {agentExtractor} from '../utils';
import PermissionItemQueries from './queries';
import {INewPermissionItemInputByEntity} from './replaceItemsByEntity/types';
import {internalAddPermissionItemsByEntity} from './replaceItemsByEntity/utils';

const permissionItemFields = getFields<IPublicPermissionItem>({
  resourceId: true,
  workspaceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  containerId: true,
  containerType: true,
  permissionEntityId: true,
  permissionEntityType: true,
  targetId: true,
  targetType: true,
  action: true,
  grantAccess: true,
  appliesTo: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);
export const permissionItemListExtractor = makeListExtract(permissionItemFields);

export function throwPermissionItemNotFound() {
  throw new NotFoundError('Permission item not found');
}

// TODO: Include a case for removing resourceId with type items
// when an item with just the resource type exists, cause it
// serves as an umbrella permission item, when other fields remain
// the same.

// TODO: Do performance check for compactPermissionItems and
// re-implement using key-value map of keys generated once using
// a combination of these fields

export function compactPermissionItems(items: IPermissionItem[]) {
  return uniqWith(
    items,
    (item01, item02) =>
      item01.permissionEntityId === item02.permissionEntityId &&
      item01.containerId === item02.containerId &&
      item01.action === item02.action &&
      item01.grantAccess === item02.grantAccess &&
      item01.appliesTo === item02.appliesTo &&
      item01.targetId === item02.targetId &&
      item01.targetType === item02.targetType
  );
}

export const publicAccessOpComparator = (item01: IPublicAccessOp, item02: IPublicAccessOp) =>
  item01.action === item02.action && item01.resourceType === item02.resourceType;

export function getPublicAccessOpArtifactsFromResource(
  resource: IResourceBase & Pick<IFile, 'folderId' | 'workspaceId'>
) {
  const type = getResourceTypeFromId(resource.resourceId);

  // Choose closest container which'll be the containing folder or workspace for
  // root-level files and folders
  const containerId = resource.folderId ?? resource.workspaceId;
  const containerType = resource.folderId ? AppResourceType.Folder : AppResourceType.Workspace;

  // File public access ops should have target ID because the op targets a
  // single file, but folder public access ops are blanket permissions. Scoping
  // is done with `appliesTo` which limits the permissions granted to the
  // container, or the container and it's children, or just it's children.
  const targetId = type === AppResourceType.File ? resource.resourceId : undefined;
  return {containerId, containerType, targetId};
}

export function makePermissionItemInputsFromPublicAccessOps(
  ops: IPublicAccessOpInput[],
  resource: IResourceBase & Pick<IFile, 'folderId' | 'workspaceId'>,
  grantAccess = true
): INewPermissionItemInputByEntity[] {
  const {containerId, containerType, targetId} = getPublicAccessOpArtifactsFromResource(resource);
  return ops.map(op => ({
    containerId,
    containerType,
    targetId,
    action: op.action,
    targetType: op.resourceType,
    appliesTo: op.appliesTo,
    grantAccess,
  }));
}

export async function replacePublicPermissionGroupAccessOps(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  addOps: IPublicAccessOp[],
  resource: IResourceBase & Pick<IFile, 'folderId' | 'workspaceId'>
) {
  const {containerId, containerType, targetId} = getPublicAccessOpArtifactsFromResource(resource);

  if (workspace.publicPermissionGroupId) {
    await context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByPermissionEntityAndContainer(
        workspace.publicPermissionGroupId,
        AppResourceType.PermissionGroup,
        containerId,
        containerType
      )
    );

    if (addOps.length > 0) {
      await internalAddPermissionItemsByEntity(context, agent, {
        workspaceId: workspace.resourceId,
        permissionEntityId: workspace.publicPermissionGroupId,
        permissionEntityType: AppResourceType.PermissionGroup,
        items: makePermissionItemInputsFromPublicAccessOps(addOps, resource),
      });
    }
  }
}

export interface IPermissionItemBase {
  containerId: string;
  containerType: AppResourceType;
  targetId?: string;
  targetType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess?: boolean;
  isForPermissionContainer?: boolean;
}

export const permissionItemIndexer = (item: IPermissionItemBase) => {
  return makeKey([
    item.permissionEntityId,
    item.containerId,
    item.targetId,
    item.targetType,
    item.action,
    item.grantAccess,
    item.isForPermissionContainer,
  ]);
};

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}
