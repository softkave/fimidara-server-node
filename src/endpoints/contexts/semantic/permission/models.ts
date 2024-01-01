import {
  AssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionAction, PermissionItem} from '../../../../definitions/permissionItem';
import {
  AppResourceType,
  Resource,
  kAppResourceType,
} from '../../../../definitions/system';
import {appAssert} from '../../../../utils/assertion';
import {toCompactArray} from '../../../../utils/fns';
import {indexArray} from '../../../../utils/indexArray';
import {getResourceTypeFromId} from '../../../../utils/resource';
import {kReuseableErrors} from '../../../../utils/reusableErrors';
import {DataQuery, LiteralDataQuery} from '../../data/types';
import {kSemanticModels} from '../../injection/injectables';
import {SemanticProviderRunOptions} from '../types';
import {getInAndNinQuery} from '../utils';
import {
  SemanticPermissionProviderType,
  SemanticPermissionProviderType_CountPermissionItemsProps,
  SemanticPermissionProviderType_GetPermissionItemsProps,
} from './types';

export class DataSemanticPermission implements SemanticPermissionProviderType {
  async getEntityInheritanceMap(
    props: {
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticProviderRunOptions | undefined
  ): Promise<PermissionEntityInheritanceMap> {
    {
      const entity = this.getEntity(props);
      appAssert(entity, kReuseableErrors.entity.notFound(props.entityId));

      let nextIdList = [props.entityId];
      const map: PermissionEntityInheritanceMap = {
        [props.entityId]: {id: props.entityId, items: [], resolvedOrder: 0},
      };
      const maxDepth = props.fetchDeep ? 20 : 1;

      for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
        const assignedItems = await kSemanticModels.assignedItem().getManyByQuery(
          {
            assigneeId: {$in: nextIdList},
            assignedItemType: kAppResourceType.PermissionGroup,
          },
          options
        );
        const nextIdMap: Record<string, string> = {};
        assignedItems.forEach(item => {
          nextIdMap[item.assignedItemId] = item.assignedItemId;
          map[item.assignedItemId] = {
            id: item.assignedItemId,
            items: [],
            resolvedOrder: depth + 1,
          };
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
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticProviderRunOptions | undefined
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }> {
    const map = await this.getEntityInheritanceMap(props, options);
    const idList = Object.keys(map).filter(id => id !== props.entityId);
    const permissionGroups = await kSemanticModels
      .permissionGroup()
      .getManyByQuery({resourceId: {$in: idList}}, options);
    return {permissionGroups, inheritanceMap: map};
  }

  async getPermissionItems(
    props: SemanticPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticProviderRunOptions | undefined
  ): Promise<PermissionItem[]> {
    const {targetItemsQuery} = this.getPermissionItemsQuery(props);
    const items = await kSemanticModels
      .permissionItem()
      .getManyByQuery(targetItemsQuery, options);

    if (props.sortByTarget || props.sortByDate || props.sortByEntity) {
      this.sortItems(
        items,
        props.entityId,
        props.targetId,
        props.sortByEntity,
        props.sortByTarget,
        props.sortByDate
      );
    }

    return items;
  }

  async countPermissionItems(
    props: SemanticPermissionProviderType_CountPermissionItemsProps,
    options?: SemanticProviderRunOptions | undefined
  ): Promise<number> {
    const {targetItemsQuery} = this.getPermissionItemsQuery(props);
    return await kSemanticModels.permissionItem().countByQuery(targetItemsQuery, options);
  }

  async getEntity(
    props: {
      entityId: string;
    },
    opts?: SemanticProviderRunOptions
  ): Promise<Resource | null> {
    const type = getResourceTypeFromId(props.entityId);
    const query: LiteralDataQuery<Resource> = {resourceId: props.entityId};
    if (type === kAppResourceType.User)
      return await kSemanticModels.user().getOneByQuery(query, opts);
    if (type === kAppResourceType.AgentToken)
      return await kSemanticModels.agentToken().getOneByQuery(query, opts);
    if (type === kAppResourceType.PermissionGroup)
      return await kSemanticModels.permissionGroup().getOneByQuery(query, opts);
    return null;
  }

  sortItems(
    items: PermissionItem[],
    entityId: string | string[] | undefined,
    targetId: string | string[] | undefined,
    sortByEntity?: boolean,
    sortByTarget?: boolean,
    sortByDate?: boolean
  ): PermissionItem[] {
    const targetIdMap = sortByTarget
      ? indexArray(toCompactArray(targetId), {
          reducer: (item, arr, i) => i,
        })
      : {};
    const entityIdMap = sortByEntity
      ? indexArray(toCompactArray(entityId), {
          reducer: (item, arr, i) => i,
        })
      : {};

    return items.sort((item01, item02) => {
      if (sortByEntity && item01.entityId !== item02.entityId) {
        return (
          (entityIdMap[item01.entityId] ?? Number.MAX_SAFE_INTEGER) -
          (entityIdMap[item02.entityId] ?? Number.MAX_SAFE_INTEGER)
        );
      } else if (sortByTarget && item01.targetId !== item02.targetId) {
        return (
          (targetIdMap[item01.targetId] ?? Number.MAX_SAFE_INTEGER) -
          (targetIdMap[item02.targetId] ?? Number.MAX_SAFE_INTEGER)
        );
      } else if (sortByDate) {
        return (item01.lastUpdatedAt - item02.lastUpdatedAt) * -1;
      }

      // Maintain current order.
      return 0;
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
