import {flatten, forEach} from 'lodash';
import {File} from '../../../definitions/file';
import {PermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, ResourceWrapper, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {extractResourceIdList, isObjectEmpty, toNonNullableArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {GetTypeFromTypeOrArray} from '../../../utils/types';
import {DataQuery, LiteralDataQuery} from '../../contexts/data/types';
import {getInAndNinQuery} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {folderConstants} from '../../folders/constants';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {PermissionItemInputTarget} from '../types';
import {getPermissionItemTargets} from '../utils';
import {DeletePermissionItemInput, DeletePermissionItemsEndpointParams} from './types';

export const INTERNAL_deletePermissionItems = async (
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: DeletePermissionItemsEndpointParams
) => {
  let inputTargets: Partial<PermissionItemInputTarget>[] = [];

  // Extract out targets
  data.items?.forEach(item => {
    if (item.target) inputTargets = inputTargets.concat(toNonNullableArray(item.target));
  });

  // Fetch targets
  const [targets] = await Promise.all([
    getPermissionItemTargets(context, agent, workspace, inputTargets),
  ]);

  // For indexing files and folders by name path
  const indexByNamePath = (item: ResourceWrapper) => {
    if (item.resourceType === AppResourceType.File || AppResourceType.Folder)
      return (item.resource as unknown as Pick<File, 'namePath'>).namePath.join(
        folderConstants.nameSeparator
      );
    else return '';
  };

  // Index targets by ID and name path (for files and folders). This is for fast
  // retrieval later down the line.
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapByNamepath = indexArray(targets, {indexer: indexByNamePath});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: AppResourceType.Workspace,
  };

  const getTargets = (target: GetTypeFromTypeOrArray<DeletePermissionItemInput['target']>) => {
    let targets: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some targets are not found?
    if (target.targetId) {
      toNonNullableArray(target.targetId).forEach(targetId => {
        if (targetsMapById[targetId]) targets[targetId] = targetsMapById[targetId];
      });
    }

    if (target.folderpath) {
      toNonNullableArray(target.folderpath).forEach(folderpath => {
        const folder = targetsMapByNamepath[folderpath];
        if (folder) targets[folder.resourceId] = folder;
      });
    }

    if (target.filepath) {
      toNonNullableArray(target.filepath).forEach(filepath => {
        const file = targetsMapByNamepath[filepath];
        if (file) targets[file.resourceId] = file;
      });
    }

    if (target.workspaceRootname) {
      targets[workspace.resourceId] = workspaceWrapper;
    }

    return targets;
  };

  // Maps entity IDs to targets (target ID and target type), and targets to the
  // input permission items to be deleted. We use this to build queries of
  // permission items to be deleted. When target ID is present in the item, we
  // delete permission items with the combination of target ID and or target
  // type, and when only target type is present, we delete permission items with
  // that target type irrespective of the target ID.
  const entityIdMap: Record<
    /** entity ID */ string,
    {
      targetsMap: Record<
        /** target ID */ string,
        {
          resource: ResourceWrapper;
          item: DeletePermissionItemInput;
          targetType: AppResourceType | AppResourceType[];
        }
      >;
      targetTypesMap: Record</** target type */ string, {item: DeletePermissionItemInput}>;
    }
  > = {};

  const insertIntoContainerTargetsMap = (
    entity: string | string[],
    resource: ResourceWrapper,
    targetType: AppResourceType | AppResourceType[] | undefined,
    item: DeletePermissionItemInput
  ) => {
    toNonNullableArray(entity).forEach(entityId => {
      let outerMap = entityIdMap[entityId];

      if (!outerMap) {
        entityIdMap[entityId] = outerMap = {
          targetsMap: {},
          targetTypesMap: {},
        };
      }

      outerMap.targetsMap[resource.resourceId] = {
        resource,
        item,
        targetType: targetType ?? [resource.resourceType],
      };
    });
  };

  const insertIntoContainerTargetTypesMap = (
    entity: string | string[],
    targetType: string,
    item: DeletePermissionItemInput
  ) => {
    toNonNullableArray(entity).forEach(entityId => {
      let outerMap = entityIdMap[entityId];
      if (!outerMap)
        entityIdMap[entityId] = outerMap = {
          targetsMap: {},
          targetTypesMap: {},
        };
      outerMap.targetTypesMap[targetType] = {item};
    });
  };

  if (data.items) {
    data.items.forEach(item => {
      // Default to global entity if not present in item
      if (!item.entity) item.entity = data.entity;

      const targets = toNonNullableArray(item.target ?? []);
      toNonNullableArray(targets).forEach(target => {
        const itemTargetsMap = getTargets(target);

        if (!isObjectEmpty(itemTargetsMap)) {
          forEach(itemTargetsMap, targetResource => {
            if (item.entity)
              insertIntoContainerTargetsMap(
                item.entity.entityId,
                targetResource,
                target.targetType,
                item
              );
          });
        } else if (target.targetType) {
          toNonNullableArray(target.targetType).forEach(targetType => {
            if (item.entity)
              insertIntoContainerTargetTypesMap(item.entity.entityId, targetType, item);
          });
        }
      });
    });
  }

  const queries: DataQuery<PermissionItem>[] = [];

  forEach(entityIdMap, (outerMap, entityId) => {
    const targets = Object.values(outerMap.targetsMap);
    targets.forEach(targetEntry => {
      const query: DataQuery<PermissionItem> = {
        entityId,
        targetId: targetEntry.resource.resourceId,
        ...getInAndNinQuery<PermissionItem>('appliesTo', targetEntry.item.appliesTo),
        ...getInAndNinQuery<PermissionItem>('grantAccess', targetEntry.item.grantAccess),
        ...getInAndNinQuery<PermissionItem>('action', targetEntry.item.action),
        ...getInAndNinQuery<PermissionItem>('targetType', targetEntry.targetType),
      };
      queries.push(query);
    });

    forEach(outerMap.targetTypesMap, ({item}, targetType) => {
      const query: DataQuery<PermissionItem> = {
        entityId,
        targetType: targetType as AppResourceType,
        ...getInAndNinQuery<PermissionItem>('appliesTo', item.appliesTo),
        ...getInAndNinQuery<PermissionItem>('grantAccess', item.grantAccess),
        ...getInAndNinQuery<PermissionItem>('action', item.action),
      };
      queries.push(query);
    });
  });

  if (!queries.length) {
    if (data.entity) {
      const entityId = toNonNullableArray(data.entity.entityId);

      if (entityId.length) {
        const query: LiteralDataQuery<PermissionItem> = {entityId: {$in: entityId}};
        queries.push(query);
      }
    }
  }

  const result = await Promise.all(
    queries.map(query => context.semantic.permissionItem.getManyByQuery(query))
  );
  const permissionItems = flatten(result);
  const permissionItemsIdList = extractResourceIdList(permissionItems);
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.PermissionItem,
    args: {permissionItemsIdList, workspaceId: workspace.resourceId},
  });
  return job;
};
