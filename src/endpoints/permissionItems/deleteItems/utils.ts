import {flatten, forEach} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType, IResourceWrapper, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {extractResourceIdList, noopAsync, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {LiteralDataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {folderConstants} from '../../folders/constants';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {checkResourcesBelongToContainer} from '../../resources/containerCheckFns';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {
  IPermissionItemInput,
  IPermissionItemInputContainer,
  IPermissionItemInputTarget,
} from '../types';
import {getPermissionItemContainers, getPermissionItemTargets} from '../utils';
import {DeletePermissionItemsCascadeFnsArgs, IDeletePermissionItemsEndpointParams} from './types';

export const DELETE_PERMISSION_ITEMS_CASCADE_FNS: DeleteResourceCascadeFnsMap<DeletePermissionItemsCascadeFnsArgs> =
  {
    [AppResourceType.All]: noopAsync,
    [AppResourceType.System]: noopAsync,
    [AppResourceType.Public]: noopAsync,
    [AppResourceType.Workspace]: noopAsync,
    [AppResourceType.CollaborationRequest]: noopAsync,
    [AppResourceType.AgentToken]: noopAsync,
    [AppResourceType.Folder]: noopAsync,
    [AppResourceType.File]: noopAsync,
    [AppResourceType.User]: noopAsync,
    [AppResourceType.UsageRecord]: noopAsync,
    [AppResourceType.EndpointRequest]: noopAsync,
    [AppResourceType.Job]: noopAsync,
    [AppResourceType.Tag]: noopAsync,
    [AppResourceType.PermissionGroup]: noopAsync,
    [AppResourceType.PermissionItem]: async (context, args, opts) => {
      await Promise.all([
        context.semantic.permissionItem.deleteManyByIdList(args.permissionItemsIdList, opts),
        context.semantic.permissionItem.deleteManyByTargetId(args.permissionItemsIdList, opts),
      ]);
    },
    [AppResourceType.AssignedItem]: async (context, args, opts) => {
      await context.semantic.assignedItem.deleteResourceAssignedItems(
        args.workspaceId,
        args.permissionItemsIdList,
        undefined,
        opts
      );
    },
  };

export const INTERNAL_deletePermissionItems = async (
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IDeletePermissionItemsEndpointParams
) => {
  let inputContainers: IPermissionItemInputContainer[] = [];
  let inputTargets: IPermissionItemInputTarget[] = [];

  if (data.container) inputContainers = toArray(data.container);
  data.items?.forEach(item => {
    if (item.container) inputContainers = inputContainers.concat(toArray(item.container));
    if (item.target) inputTargets = inputTargets.concat(toArray(item.target));
  });

  const [containers, targets] = await Promise.all([
    getPermissionItemContainers(context, agent, workspace, inputContainers),
    getPermissionItemTargets(context, agent, workspace, inputTargets),
  ]);

  const indexByNamePath = (item: IResourceWrapper) => {
    if (item.resourceType === AppResourceType.File || AppResourceType.Folder)
      return (item.resource as unknown as Pick<IFile, 'namePath'>).namePath.join(
        folderConstants.nameSeparator
      );
    else return '';
  };

  const containersMapById = indexArray(containers, {path: 'resourceId'});
  const containersMapByNamepath = indexArray(containers, {indexer: indexByNamePath});
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapByNamepath = indexArray(targets, {indexer: indexByNamePath});
  const workspaceWrapper: IResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: AppResourceType.Workspace,
  };

  const tryGetContainer = (container: IPermissionItemInputContainer) => {
    let resource: IResourceWrapper | undefined = undefined;

    // TODO: should we throw error when some containers are not found?
    if (container.containerId) resource = containersMapById[container.containerId];

    // Check that it's empty because we are only picking one container
    if (container.folderpath && !resource) resource = containersMapByNamepath[container.folderpath];
    if (container.workspaceRootname && !resource) resource = workspaceWrapper;

    return resource;
  };

  const getContainer = (container: IPermissionItemInputContainer) => {
    let resource = tryGetContainer(container);
    if (!resource) resource = workspaceWrapper;
    return resource;
  };

  const getTargets = (target: IPermissionItemInputTarget) => {
    let targets: Record<string, IResourceWrapper> = {};

    // TODO: should we throw error when some targets are not found?
    if (target.targetId) {
      toArray(target.targetId).forEach(targetId => {
        targets[targetId] = targetsMapById[targetId];
      });
    }

    if (target.folderpath) {
      toArray(target.folderpath).forEach(folderpath => {
        const folder = targetsMapByNamepath[folderpath];
        if (folder) targets[folder.resourceId] = folder;
      });
    }

    if (target.filepath) {
      toArray(target.filepath).forEach(filepath => {
        const folder = targetsMapByNamepath[filepath];
        if (folder) targets[folder.resourceId] = folder;
      });
    }

    if (target.workspaceRootname) {
      targets[workspace.resourceId] = workspaceWrapper;
    }

    return targets;
  };

  const globalContainer = data.container ? getContainer(data.container) : workspaceWrapper;
  const entityIdMap: Record<
    string, // entity ID
    Record<
      string, // container ID
      {
        containerTargetsMap: Record<
          string,
          {resource: IResourceWrapper; item: Partial<IPermissionItemInput>}
        >;
        containerTargetTypesMap: Record<string, {item: Partial<IPermissionItemInput>}>;
      }
    >
  > = {};

  const insertInContainerTargetsMap = (
    entity: string | string[],
    containerId: string,
    resource: IResourceWrapper,
    item: Partial<IPermissionItemInput>
  ) => {
    toArray(entity).forEach(entityId => {
      let enMap = entityIdMap[entityId];
      if (!enMap) entityIdMap[entityId] = enMap = {};
      let ccMap = enMap[containerId];
      if (!ccMap)
        enMap[containerId] = ccMap = {containerTargetsMap: {}, containerTargetTypesMap: {}};
      ccMap.containerTargetsMap[resource.resourceId] = {resource, item};
    });
  };

  const insertInContainerTargetTypesMap = (
    entity: string | string[],
    containerId: string,
    targetType: string,
    item: Partial<IPermissionItemInput>
  ) => {
    toArray(entity).forEach(entityId => {
      let enMap = entityIdMap[entityId];
      if (!enMap) entityIdMap[entityId] = enMap = {};
      let ccMap = enMap[containerId];
      if (!ccMap)
        enMap[containerId] = ccMap = {containerTargetsMap: {}, containerTargetTypesMap: {}};
      ccMap.containerTargetTypesMap[targetType] = {item};
    });
  };

  if (data.items) {
    data.items.forEach(item => {
      if (!item.entity) item.entity = data.entity;
      if (!item.container) item.container = data.container;

      const itemContainer = item.container ? getContainer(item.container) : globalContainer;
      const targets = toArray(item.target ?? []);

      toArray(targets).forEach(target => {
        if (target.targetType) {
          toArray(target.targetType).forEach(targetType => {
            if (item.entity)
              insertInContainerTargetTypesMap(
                item.entity.entityId,
                itemContainer.resourceId,
                targetType,
                item
              );
          });
        }

        const otherTargetsMap = getTargets(target);
        forEach(otherTargetsMap, target => {
          if (item.entity)
            insertInContainerTargetsMap(
              item.entity.entityId,
              itemContainer.resourceId,
              target,
              item
            );
        });
      });
    });
  }

  const queries: LiteralDataQuery<IPermissionItem>[] = [];
  forEach(entityIdMap, (enMap, entityId) => {
    forEach(enMap, (ccMap, containerId) => {
      const targets = Object.values(ccMap.containerTargetsMap);
      const resources: IResourceWrapper[] = [];

      targets.forEach(target => {
        resources.push(target.resource);
        const query: LiteralDataQuery<IPermissionItem> = {
          entityId,
          containerId,
          targetId: target.resource.resourceId,
          grantAccess: target.item.grantAccess,
        };

        const actions = target.item.action && toArray(target.item.action);
        if (actions && actions.length) query.action = {$in: actions as any};

        queries.push(query);
      });

      if (resources.length) {
        checkResourcesBelongToContainer(containerId, resources);
      }

      forEach(ccMap.containerTargetTypesMap, ({item}, targetType) => {
        const query: LiteralDataQuery<IPermissionItem> = {
          entityId,
          containerId,
          targetType: targetType as AppResourceType,
          grantAccess: item.grantAccess,
        };

        const actions = item.action && toArray(item.action);
        if (actions && actions.length) query.action = {$in: actions as any};

        queries.push(query);
      });
    });
  });

  if (!queries.length) {
    if (data.entity) {
      const entityId = toArray(data.entity.entityId);
      const container = data.container ? getContainer(data.container) : globalContainer;
      if (entityId.length) {
        const query: LiteralDataQuery<IPermissionItem> = {
          entityId: {$in: entityId},
          containerId: container.resourceId,
        };
        queries.push(query);
      }
    } else if (data.container) {
      const container = tryGetContainer(data.container);
      if (container) {
        const query: LiteralDataQuery<IPermissionItem> = {
          containerId: container.resourceId,
        };
        queries.push(query);
      }
    }
  }

  const result = await Promise.all(
    queries.map(query => context.semantic.permissionItem.getManyByLiteralDataQuery(query))
  );
  const permissionItems = flatten(result);
  const permissionItemsIdList = extractResourceIdList(permissionItems);
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.PermissionItem,
    args: {
      permissionItemsIdList,
      workspaceId: workspace.resourceId,
    },
  });
  return job;
};
