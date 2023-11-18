import {
  AssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionAction, PermissionItem} from '../../../../definitions/permissionItem';
import {AppResourceType, Resource} from '../../../../definitions/system';
import {appAssert} from '../../../../utils/assertion';
import {toNonNullableArray} from '../../../../utils/fns';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resource';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {DataQuery, LiteralDataQuery} from '../../data/types';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {
  SemanticDataAccessPermissionProviderType,
  SemanticDataAccessPermissionProviderType_CountPermissionItemsProps,
  SemanticDataAccessPermissionProviderType_GetPermissionItemsProps,
} from './types';

export class DataSemanticDataAccessPermission
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
        const assignedItems = await context.semantic.assignedItem.getManyByQuery(
          {
            assigneeId: {$in: nextIdList},
            assignedItemType: AppResourceType.PermissionGroup,
          },
          options
        );
        const nextIdMap: Record<string, string> = {};
        assignedItems.forEach(item => {
          nextIdMap[item.assignedItemId] = item.assignedItemId;
          map[item.assignedItemId] = {id: item.assignedItemId, items: []};
          const entry = map[item.assigneeId];

          if (entry) {
            const meta: AssignedPermissionGroupMeta = {
              assignedAt: item.createdAt,
              assignedBy: item.createdBy,
              permissionGroupId: item.assignedItemId,
              assigneeEntityId: item.assigneeId,
            };
            entry.items.push(meta);
          }
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
    const map = await this.getEntityInheritanceMap(props, options);
    const idList = Object.keys(map).filter(id => id !== props.entityId);
    const permissionGroups = await props.context.semantic.permissionGroup.getManyByQuery(
      {resourceId: {$in: idList}},
      options
    );
    return {permissionGroups, inheritanceMap: map};
  }

  async getPermissionItems(
    props: SemanticDataAccessPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<PermissionItem[]> {
    const {targetItemsQuery} = this.getPermissionItemsQuery(props);
    const items = await props.context.semantic.permissionItem.getManyByQuery(
      targetItemsQuery,
      options
    );

    if (props.sortByTarget && props.targetId) {
      this.sortByTarget(props.targetId, items, props.sortByDate);
    }

    if (props.sortByDate) {
      this.sortByDate(items);
    }

    return items;
  }

  async countPermissionItems(
    props: SemanticDataAccessPermissionProviderType_CountPermissionItemsProps,
    options?: SemanticDataAccessProviderRunOptions | undefined
  ): Promise<number> {
    const {targetItemsQuery} = this.getPermissionItemsQuery(props);
    return await props.context.semantic.permissionItem.countByQuery(
      targetItemsQuery,
      options
    );
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
      return await props.context.semantic.user.getOneByQuery(query, opts);
    if (type === AppResourceType.AgentToken)
      return await props.context.semantic.agentToken.getOneByQuery(query, opts);
    if (type === AppResourceType.PermissionGroup)
      return await props.context.semantic.permissionGroup.getOneByQuery(query, opts);
    return null;
  }

  sortByDate(items: PermissionItem[]): PermissionItem[] {
    return items.sort((item01, item02) => {
      return item02.lastUpdatedAt - item01.lastUpdatedAt;
    });
  }

  sortByTarget(
    targetId: string | string[],
    items: PermissionItem[],
    sortByDate?: boolean
  ): PermissionItem[] {
    const targetIdMap = indexArray(toNonNullableArray(targetId), {
      reducer: (item, arr, i) => i,
    });

    return items.sort((item01, item02) => {
      if (item01.targetId !== item01.targetId) {
        if (targetIdMap) {
          return (
            (targetIdMap[item01.targetId] ?? Number.MAX_SAFE_INTEGER) -
            (targetIdMap[item02.targetId] ?? Number.MAX_SAFE_INTEGER)
          );
        }
      } else if (sortByDate) {
        return item01.lastUpdatedAt - item02.lastUpdatedAt;
      }

      // Maintain current order.
      return -1;
    });
  }

  protected getPermissionItemsQuery(props: {
    entityId?: string | string[];
    action?: PermissionAction | PermissionAction[];
    targetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    targetParentId?: string;
  }) {
    let targetItemsQuery: DataQuery<PermissionItem> | undefined = undefined;

    if (props.targetId) {
      targetItemsQuery = {
        ...getInAndNinQuery<PermissionItem>('targetId', props.targetId),
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
      };
    } else if (props.targetType) {
      targetItemsQuery = {
        targetParentId: props.targetParentId,
        ...getInAndNinQuery<PermissionItem>('targetType', props.targetType),
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
      };
    }

    // For when we want to fetch an entity's permissions regardless of container
    // or target
    if (!targetItemsQuery && props.entityId) {
      targetItemsQuery = {
        targetParentId: props.targetParentId,
        ...getInAndNinQuery<PermissionItem>('entityId', props.entityId),
        ...getInAndNinQuery<PermissionItem>('action', props.action),
      };
    }

    if (!targetItemsQuery) {
      throw new Error('Provide targetId, or targetType, or entityId');
    }

    return {targetItemsQuery};
  }
}
