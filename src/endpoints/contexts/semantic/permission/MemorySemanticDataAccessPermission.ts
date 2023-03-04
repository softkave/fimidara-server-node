import {uniq} from 'lodash';
import {
  IAssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
} from '../../../../definitions/permissionGroups';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, IResourceBase} from '../../../../definitions/system';
import {appAssert} from '../../../../utils/assertion';
import {ServerError} from '../../../../utils/errors';
import {toArray, toCompactArray} from '../../../../utils/fns';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resourceId';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {INCLUDE_IN_PROJECTION, LiteralDataQuery} from '../../data/types';
import {IBaseContext} from '../../types';
import {ISemanticDataAccessPermissionProvider} from './types';

export class MemorySemanticDataAccessPermission implements ISemanticDataAccessPermissionProvider {
  async getEntityInheritanceMap(props: {
    context: IBaseContext;
    entityId: string;
    fetchDeep?: boolean;
  }) {
    const {context} = props;
    const entity = this.getEntity(props);
    appAssert(entity, reuseableErrors.entity.notFound(props.entityId));

    const map: PermissionEntityInheritanceMap = {};
    const maxDepth = props.fetchDeep ? 100 : 1;
    let nextIdList = [props.entityId];

    for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
      const nextIdMap: Record<string, number> = {};
      const assignedItems = context.memstore.assignedItem.readManyItems({
        assigneeId: {$in: nextIdList},
      });
      assignedItems.forEach(item => {
        nextIdMap[item.assignedItemId] = INCLUDE_IN_PROJECTION;
        let entry = map[item.assigneeId];
        if (!entry) {
          map[item.assigneeId] = entry = {
            id: item.assigneeId,
            items: [],
          };
        }

        const meta: IAssignedPermissionGroupMeta = {
          assignedAt: item.createdAt,
          assignedBy: item.createdBy,
          permissionGroupId: item.assignedItemId,
          assigneeEntityId: item.assigneeId,
        };
        entry.items.push(meta);
      });
      nextIdList = Object.keys(nextIdMap);
    }

    return map;
  }

  async getEntityAssignedPermissionGroups(props: {
    context: IBaseContext;
    entityId: string;
    fetchDeep?: boolean;
  }) {
    const map = await this.getEntityInheritanceMap(props);
    const idList = Object.keys(map);
    const permissionGroups = props.context.memstore.permissionGroup.readManyItems({
      resourceId: {$in: idList},
    });
    return {permissionGroups, inheritanceMap: map};
  }

  async getEntitiesPermissionItems(props: {
    context: IBaseContext;
    entityId: string[];
    action?: BasicCRUDActions | BasicCRUDActions[];
    targetId?: string | string[];
    strictTargetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
    appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
    sortByDate?: boolean;
    sortByContainer?: boolean;
    sortByEntity?: boolean;
  }) {
    const query: LiteralDataQuery<IPermissionItem> = this.getEntitiesPermissionItemsQuery(props);
    const items = props.context.memstore.permissionItem.readManyItems(query);

    if (props.sortByDate || props.sortByContainer || props.sortByEntity) {
      const entityIdMap = props.entityId
        ? indexArray(toCompactArray(props.entityId), {reducer: (item, arr, i) => i})
        : undefined;
      const containerIdMap = props.containerId
        ? indexArray(toCompactArray(props.containerId), {reducer: (item, arr, i) => i})
        : undefined;
      items.sort((item01, item02) => {
        if (item01.entityId !== item02.entityId) {
          if (entityIdMap) {
            return (
              (entityIdMap[item01.containerId] ?? Number.MAX_SAFE_INTEGER) -
              (entityIdMap[item02.containerId] ?? Number.MAX_SAFE_INTEGER)
            );
          } else {
            // Maintain current order if they do not belong to the same entity,
            // other sorting criteria that follow depend on this.
            return -1;
          }
        }

        if (props.sortByDate && item01.containerId === item02.containerId) {
          return item01.lastUpdatedAt - item02.lastUpdatedAt;
        }

        if (containerIdMap && item01.containerId !== item02.containerId) {
          return (
            (containerIdMap[item01.containerId] ?? Number.MAX_SAFE_INTEGER) -
            (containerIdMap[item02.containerId] ?? Number.MAX_SAFE_INTEGER)
          );
        }

        // Maintain current order.
        return -1;
      });
    }

    return items;
  }

  async deleteEntitiesPermissionItems(props: {
    context: IBaseContext;
    entityId: string[];
    action?: BasicCRUDActions | BasicCRUDActions[];
    targetId?: string | string[];
    strictTargetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
    appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  }) {
    const query: LiteralDataQuery<IPermissionItem> = this.getEntitiesPermissionItemsQuery(props);
    appAssert(false, new ServerError(), 'Not implemented');
  }

  async getEntity(props: {context: IBaseContext; entityId: string}) {
    const type = getResourceTypeFromId(props.entityId);
    const query: LiteralDataQuery<IResourceBase> = {resourceId: props.entityId};
    if (type === AppResourceType.User) return await props.context.memstore.user.readItem(query);
    if (type === AppResourceType.UserToken)
      return await props.context.memstore.userToken.readItem(query);
    if (type === AppResourceType.AgentToken)
      return await props.context.memstore.agentToken.readItem(query);
    if (type === AppResourceType.ClientAssignedToken)
      return await props.context.memstore.clientAssignedToken.readItem(query);
    if (type === AppResourceType.PermissionGroup)
      return await props.context.memstore.permissionGroup.readItem(query);
    return null;
  }

  private getEntitiesPermissionItemsQuery(props: {
    entityId: string[];
    action?: BasicCRUDActions | BasicCRUDActions[];
    targetId?: string | string[];
    strictTargetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
    appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  }) {
    let query: LiteralDataQuery<IPermissionItem> = {};

    type T = keyof Parameters<
      ISemanticDataAccessPermissionProvider['getEntitiesPermissionItems']
    >[0];
    const keys: Array<[T, keyof IPermissionItem]> = [
      ['action', 'action'],
      ['appliesTo', 'appliesTo'],
      ['containerId', 'containerId'],
      ['targetType', 'containerType'],
      ['entityId', 'entityId'],
    ];
    const extractKeys = <K1 extends string, K2 extends string>(
      keys: Array<[K1, K2]>,
      item: Partial<Record<K1, any>>
    ) => {
      const extract: Partial<Record<K2, any>> = {};
      for (const [k1, k2] of keys) {
        if (item[k1]) {
          extract[k2] = item[k1];
        }
      }
      return extract;
    };

    if (props.strictTargetId) {
      query = {
        ...extractKeys(keys, props),
        targetId: {$in: toArray(props.strictTargetId)},
      };
    } else {
      const targetType = uniq(
        toCompactArray(props.targetId)
          .map(getResourceTypeFromId)
          .concat(props.targetType ?? [])
      );
      const queryParts = extractKeys(keys, props);
      query = {
        ...queryParts,
        targetId: props.targetId
          ? {$in: toArray<string | null>(props.targetId).concat(null)}
          : null,
        targetType: targetType.length ? {$in: targetType as any} : undefined,
      };
    }

    return query;
  }
}
