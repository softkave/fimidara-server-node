import {difference} from 'lodash';
import {
  AssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionItem, PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {AppActionType, AppResourceType, Resource} from '../../../../definitions/system';
import {appAssert} from '../../../../utils/assertion';
import {toNonNullableArray} from '../../../../utils/fns';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resource';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {LiteralDataQuery} from '../../data/types';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {SemanticDataAccessPermissionProviderType} from './types';

export class MemorySemanticDataAccessPermission
  implements SemanticDataAccessPermissionProviderType
{
  async getEntityInheritanceMap(
    props: {
      context: BaseContextType;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<PermissionEntityInheritanceMap> {
    {
      const {context} = props;
      const entity = this.getEntity(props);
      appAssert(entity, reuseableErrors.entity.notFound(props.entityId));

      let nextIdList = [props.entityId];
      const map: PermissionEntityInheritanceMap = {
        [props.entityId]: {id: props.entityId, items: []},
      };
      const maxDepth = props.fetchDeep ? 20 : 1;

      for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
        const assignedItems = await context.memstore.assignedItem.readManyItems(
          {assigneeId: {$in: nextIdList}, assignedItemType: AppResourceType.PermissionGroup},
          options?.transaction
        );
        const nextIdMap: Record<string, string> = {};
        assignedItems.forEach(item => {
          nextIdMap[item.assignedItemId] = item.assignedItemId;
          map[item.assignedItemId] = {id: item.assignedItemId, items: []};
          const entry = map[item.assigneeId];
          const meta: AssignedPermissionGroupMeta = {
            assignedAt: item.createdAt,
            assignedBy: item.createdBy,
            permissionGroupId: item.assignedItemId,
            assigneeEntityId: item.assigneeId,
          };
          entry.items.push(meta);
        });
        nextIdList = Object.values(nextIdMap);
      }

      return map;
    }
  }

  async getEntityAssignedPermissionGroups(
    props: {
      context: BaseContextType;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }> {
    const map = await this.getEntityInheritanceMap(props);
    const idList = Object.keys(map).filter(id => id !== props.entityId);
    const permissionGroups = await props.context.memstore.permissionGroup.readManyItems(
      {resourceId: {$in: idList}},
      options?.transaction
    );
    return {permissionGroups, inheritanceMap: map};
  }

  async getPermissionItems(
    props: {
      context: BaseContextType;
      entityId?: string | string[];
      action?: AppActionType | AppActionType[];
      targetId?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
      sortByDate?: boolean;
      sortByContainer?: boolean;
    },
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<PermissionItem[]> {
    const {q01, q02} = this.getPermissionItemsQuery(props);

    // TODO: use $or query when implemented
    const [items01, items02] = await Promise.all([
      props.context.memstore.permissionItem.readManyItems(q01, options?.transaction),
      props.context.memstore.permissionItem.readManyItems(q02, options?.transaction),
    ]);

    if (props.sortByDate || props.sortByContainer) {
      const containerIdMap =
        props.containerId && props.sortByContainer
          ? indexArray(toNonNullableArray(props.containerId), {reducer: (item, arr, i) => i})
          : undefined;

      items01.sort((item01, item02) => {
        if (props.sortByDate) {
          return item01.lastUpdatedAt - item02.lastUpdatedAt;
        }

        // Maintain current order.
        return -1;
      });

      items02.sort((item01, item02) => {
        if (item01.targetId !== item01.targetId) {
          if (containerIdMap) {
            return (
              (containerIdMap[item01.targetId] ?? Number.MAX_SAFE_INTEGER) -
              (containerIdMap[item02.targetId] ?? Number.MAX_SAFE_INTEGER)
            );
          }
        } else if (props.sortByDate) {
          return item01.lastUpdatedAt - item02.lastUpdatedAt;
        }

        // Maintain current order.
        return -1;
      });
    }

    const items = items01.concat(items02);
    return items;
  }

  async countPermissionItems(
    props: {
      context: BaseContextType;
      entityId?: string | string[];
      action?: AppActionType | AppActionType[];
      targetId?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
    },
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    const {q01, q02} = this.getPermissionItemsQuery(props);

    // TODO: use $or query when implemented
    const [count01, count02] = await Promise.all([
      props.context.memstore.permissionItem.countItems(q01, options?.transaction),
      props.context.memstore.permissionItem.countItems(q02, options?.transaction),
    ]);

    return count01 + count02;
  }

  async getEntity(
    props: {
      context: BaseContextType;
      entityId: string;
    },
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<Resource | null> {
    const type = getResourceTypeFromId(props.entityId);
    const query: LiteralDataQuery<Resource> = {resourceId: props.entityId};
    if (type === AppResourceType.User)
      return await props.context.memstore.user.readItem(query, opts?.transaction);
    if (type === AppResourceType.AgentToken)
      return await props.context.memstore.agentToken.readItem(query, opts?.transaction);
    if (type === AppResourceType.PermissionGroup)
      return await props.context.memstore.permissionGroup.readItem(query, opts?.transaction);
    return null;
  }

  protected getPermissionItemsQuery(props: {
    entityId?: string | string[];
    action?: AppActionType | AppActionType[];
    targetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
  }) {
    const inputContainerIdList = props.containerId ? toNonNullableArray(props.containerId) : [];
    const inputTargetIdList = props.targetId ? toNonNullableArray(props.targetId) : [];
    const containerIdList =
      inputContainerIdList.length && inputTargetIdList.length
        ? difference(inputContainerIdList, inputTargetIdList)
        : inputContainerIdList;
    const targetIdList =
      containerIdList.length && inputTargetIdList.length
        ? difference(inputTargetIdList, containerIdList)
        : inputTargetIdList;
    const q01: LiteralDataQuery<PermissionItem> = {
      entityId: props.entityId ? {$in: toNonNullableArray(props.entityId)} : undefined,
      action: props.action ? {$in: toNonNullableArray(props.action) as any} : undefined,
      targetId: containerIdList.length ? {$in: toNonNullableArray(containerIdList)} : undefined,
      targetType: props.targetType ? {$in: toNonNullableArray(props.targetType) as any} : undefined,
      appliesTo: {
        $in: [
          PermissionItemAppliesTo.SelfAndChildrenOfType,
          PermissionItemAppliesTo.ChildrenOfType,
        ] as any,
      },
    };
    const q02: LiteralDataQuery<PermissionItem> = {
      entityId: props.entityId ? {$in: toNonNullableArray(props.entityId)} : undefined,
      action: props.action ? {$in: toNonNullableArray(props.action) as any} : undefined,
      targetId: targetIdList.length ? {$in: toNonNullableArray(targetIdList)} : undefined,
      targetType: props.targetType ? {$in: toNonNullableArray(props.targetType) as any} : undefined,
      appliesTo: {
        $in: [PermissionItemAppliesTo.Self, PermissionItemAppliesTo.SelfAndChildrenOfType] as any,
      },
    };

    return {q01, q02};
  }
}
