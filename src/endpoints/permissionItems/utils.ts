import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {NotFoundError} from '../errors';
import {agentExtractor} from '../utils';
import {IPublicPermissionItem} from './types';

const permissionItemFields = getFields<IPublicPermissionItem>({
  resourceId: true,
  organizationId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  permissionOwnerId: true,
  permissionOwnerType: true,
  permissionEntityId: true,
  permissionEntityType: true,
  itemResourceId: true,
  itemResourceType: true,
  action: true,
  isExclusion: true,
  isForPermissionOwnerOnly: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);

export const permissionItemListExtractor = makeListExtract(
  permissionItemFields
);

export function throwPermissionItemNotFound() {
  throw new NotFoundError('Permission item not found');
}

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}
