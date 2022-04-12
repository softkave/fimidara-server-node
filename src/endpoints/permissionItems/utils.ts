import {uniqWith} from 'lodash';
import {IWorkspace} from '../../definitions/workspace';
import {
  IPermissionItem,
  IPublicPermissionItem,
  PermissionItemAppliesTo,
} from '../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
  IPublicAccessOpInput,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {agentExtractor} from '../utils';
import {internalReplacePermissionItemsByEntity} from './replaceItemsByEntity/internalReplaceItemsByEntity';
import {INewPermissionItemInputByEntity} from './replaceItemsByEntity/types';
import PermissionItemQueries from './queries';
import {makeKey} from '../../utilities/fns';

const permissionItemFields = getFields<IPublicPermissionItem>({
  resourceId: true,
  workspaceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  permissionOwnerId: true,
  permissionOwnerType: true,
  permissionEntityId: true,
  permissionEntityType: true,
  itemResourceId: true,
  itemResourceType: true,
  action: true,
  grantAccess: true,
  appliesTo: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);

export const permissionItemListExtractor =
  makeListExtract(permissionItemFields);

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
      item01.permissionEntityType === item02.permissionEntityType &&
      item01.permissionOwnerId === item02.permissionOwnerId &&
      item01.permissionOwnerType === item02.permissionOwnerType &&
      item01.action === item02.action &&
      item01.grantAccess === item02.grantAccess &&
      item01.appliesTo === item02.appliesTo &&
      item01.itemResourceId === item02.itemResourceId &&
      item01.itemResourceType === item02.itemResourceType
  );
}

export const publicAccessOpComparator = (
  item01: IPublicAccessOp,
  item02: IPublicAccessOp
) =>
  item01.action === item02.action &&
  item01.resourceType === item02.resourceType;

export function makePermissionItemInputsFromPublicAccessOps(
  permissionOwnerId: string,
  permissionOwnerType: AppResourceType,
  ops: IPublicAccessOpInput[],
  itemResourceId?: string,
  grantAccess = true,
  appliesTo = PermissionItemAppliesTo.OwnerAndChildren
): INewPermissionItemInputByEntity[] {
  return ops.map(op => ({
    permissionOwnerId,
    permissionOwnerType,
    itemResourceId,
    action: op.action,
    itemResourceType: op.resourceType,
    grantAccess,
    appliesTo,
  }));
}

export async function replacePublicPresetAccessOpsByPermissionOwner(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  permissionOwnerId: string,
  permissionOwnerType: AppResourceType,
  addOps: IPublicAccessOp[],
  itemResourceId?: string
) {
  if (workspace.publicPresetId) {
    await context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntityAndOwner(
        workspace.publicPresetId,
        AppResourceType.PresetPermissionsGroup,
        permissionOwnerId,
        permissionOwnerType
      )
    );

    if (addOps.length > 0) {
      await internalReplacePermissionItemsByEntity(context, agent, {
        workspaceId: workspace.resourceId,
        permissionEntityId: workspace.publicPresetId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
        items: makePermissionItemInputsFromPublicAccessOps(
          permissionOwnerId,
          permissionOwnerType,
          addOps,
          itemResourceId
        ),
      });
    }
  }
}

export interface IPermissionItemBase {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess?: boolean;
  isForPermissionOwner?: boolean;
}

export const permissionItemIndexer = (item: IPermissionItemBase) => {
  return makeKey([
    item.permissionEntityId,
    item.permissionEntityType,
    item.permissionOwnerId,
    item.permissionOwnerType,
    item.itemResourceId,
    item.itemResourceType,
    item.action,
    item.grantAccess,
    item.isForPermissionOwner,
  ]);
};

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}
