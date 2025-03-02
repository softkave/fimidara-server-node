import {AssignedItem} from '../../../definitions/assignedItem.js';
import {
  AssignedPermissionGroupMeta,
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../definitions/permissionGroups.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
} from '../../../definitions/permissionItem.js';
import {Resource, kFimidaraResourceType} from '../../../definitions/system.js';
import {
  kPublicSessionAgent,
  kSystemSessionAgent,
} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {toCompactArray} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {getResourceTypeFromId} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {DataQuery, LiteralDataQuery} from '../../data/types.js';
import {kIjxSemantic} from '../../ijx/injectables.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';
import {getInAndNinQuery} from '../utils.js';
import {
  SemanticPermissionProviderType,
  SemanticPermissionProviderType_CountPermissionItemsProps,
  SemanticPermissionProviderType_GetPermissionItemsProps,
} from './types.js';

export class DataSemanticPermission implements SemanticPermissionProviderType {
  async getEntityInheritanceMap(
    props: {
      workspaceId: string;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticProviderOpParams | undefined
  ): Promise<PermissionEntityInheritanceMap> {
    {
      const entity = await this.getEntity(props);
      appAssert(entity, kReuseableErrors.entity.notFound(props.entityId));

      const maxDepth = props.fetchDeep ? 20 : 1;
      let nextIdList = [props.entityId];
      const map: PermissionEntityInheritanceMap = {
        [props.entityId]: {id: props.entityId, items: [], resolvedOrder: 0},
      };

      for (let depth = 0; nextIdList.length && depth < maxDepth; depth++) {
        const query = addIsDeletedIntoQuery<DataQuery<AssignedItem>>(
          {
            workspaceId: props.workspaceId,
            assigneeId: {$in: nextIdList},
            assignedItemType: kFimidaraResourceType.PermissionGroup,
          },
          options?.includeDeleted || false
        );

        const assignedItems = await kIjxSemantic
          .assignedItem()
          .getManyByQuery(query, options);

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
      workspaceId: string;
      entityId: string;
      fetchDeep?: boolean | undefined;
    },
    options?: SemanticProviderQueryListParams<PermissionGroup> | undefined
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }> {
    const map = await this.getEntityInheritanceMap(props, options);
    const idList = Object.keys(map).filter(id => id !== props.entityId);
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      {resourceId: {$in: idList}},
      options?.includeDeleted || false
    );

    const permissionGroups = await kIjxSemantic
      .permissionGroup()
      .getManyByQuery(query, options);

    return {permissionGroups, inheritanceMap: map};
  }

  async getPermissionItems(
    props: SemanticPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticProviderQueryListParams<PermissionItem> | undefined
  ): Promise<PermissionItem[]> {
    const {targetItemsQuery} = this.getPermissionItemsQuery(props);
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      targetItemsQuery,
      options?.includeDeleted || false
    );
    const items = await kIjxSemantic
      .permissionItem()
      .getManyByQuery(query, options);

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
    options?: SemanticProviderOpParams | undefined
  ): Promise<number> {
    const {targetItemsQuery} = this.getPermissionItemsQuery(props);
    const query = addIsDeletedIntoQuery<DataQuery<Resource>>(
      targetItemsQuery,
      options?.includeDeleted || false
    );
    return await kIjxSemantic.permissionItem().countByQuery(query, options);
  }

  async getEntity(
    props: {entityId: string},
    opts?: SemanticProviderQueryParams<Resource>
  ): Promise<Resource | null> {
    if (props.entityId === kPublicSessionAgent.agentId) {
      return kPublicSessionAgent.agentToken;
    }

    if (props.entityId === kSystemSessionAgent.agentId) {
      return kSystemSessionAgent.agentToken;
    }

    const type = getResourceTypeFromId(props.entityId);
    const query: LiteralDataQuery<Resource> = {resourceId: props.entityId};
    const dataQuery = addIsDeletedIntoQuery<DataQuery<Resource>>(
      query,
      opts?.includeDeleted || false
    );

    if (type === kFimidaraResourceType.User) {
      return await kIjxSemantic.user().getOneByQuery(dataQuery, opts);
    }

    if (type === kFimidaraResourceType.AgentToken) {
      return await kIjxSemantic.agentToken().getOneByQuery(dataQuery, opts);
    }

    if (type === kFimidaraResourceType.PermissionGroup) {
      return await kIjxSemantic
        .permissionGroup()
        .getOneByQuery(dataQuery, opts);
    }

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
    action?: FimidaraPermissionAction | FimidaraPermissionAction[];
    targetId?: string | string[];
    targetParentId?: string;
  }) {
    let targetItemsQuery: DataQuery<PermissionItem> | undefined = undefined;

    if (props.targetId) {
      targetItemsQuery = {
        ...getInAndNinQuery<PermissionItem>('targetId', props.targetId),
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
