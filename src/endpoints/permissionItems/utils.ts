import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicPermissionItem} from './types';

const permissionItemFields = getFields<IPublicPermissionItem>({
  itemId: true,
  organizationId: true,
  environmentId: true,
  createdAt: getDateString,
  permissionOwnerId: true,
  permissionOwnerType: true,
  permissionEntityId: true,
  permissionEntityType: true,
  action: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);

export const permissionItemListExtractor = makeListExtract(
  permissionItemFields
);

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}
