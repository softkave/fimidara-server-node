import {IPermissionItem} from '../../definitions/permissionItem';
import {ISessionAgent, BasicCRUDActions} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IBaseContext} from '../contexts/BaseContext';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor} from '../utils';
import PermissionItemQueries from './queries';
import {IPublicPermissionItem} from './types';

const permissionItemFields = getFields<IPublicPermissionItem>({
  itemId: true,
  organizationId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  permissionOwnerId: true,
  permissionOwnerType: true,
  permissionEntityId: true,
  permissionEntityType: true,
  resourceId: true,
  resourceType: true,
  action: true,
  isExclusion: true,
  isForPermissionOwnerOnly: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);

export const permissionItemListExtractor = makeListExtract(
  permissionItemFields
);

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}
