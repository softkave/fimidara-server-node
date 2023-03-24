import {forEach, merge} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  IResourceWrapper,
  ISessionAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {extractResourceIdList, newWorkspaceResource, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {
  sortOutPermissionItems,
  uniquePermissionItems,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IBaseContext} from '../../contexts/types';
import {InvalidRequestError} from '../../errors';
import {folderConstants} from '../../folders/constants';
import {checkResourcesBelongToContainer} from '../../resources/containerCheckFns';
import {
  IPermissionItemInputContainer,
  IPermissionItemInputEntity,
  IPermissionItemInputTarget,
} from '../types';
import {
  getPermissionItemContainers,
  getPermissionItemEntities,
  getPermissionItemTargets,
  getTargetType,
} from '../utils';
import {IAddPermissionItemsEndpointParams} from './types';

export const INTERNAL_addPermissionItems = async (
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: IAddPermissionItemsEndpointParams,
  opts: ISemanticDataAccessProviderMutationRunOptions
) => {
  let inputEntities: IPermissionItemInputEntity[] = [];
  let inputContainers: IPermissionItemInputContainer[] = [];
  let inputTargets: IPermissionItemInputTarget[] = [];

  if (data.entity) inputEntities = toArray(data.entity);
  if (data.container) inputContainers = toArray(data.container);
  data.items.forEach(item => {
    if (item.entity) inputEntities = inputEntities.concat(toArray(item.entity));
    if (item.container) inputContainers = inputContainers.concat(toArray(item.container));
    if (item.target) inputTargets = inputTargets.concat(toArray(item.target));
  });

  appAssert(inputEntities.length, new InvalidRequestError('No permission entity provided.'));

  const [entities, containers, targets] = await Promise.all([
    getPermissionItemEntities(context, agent, workspace.resourceId, inputEntities),
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

  const entitiesMapById = indexArray(entities, {path: 'resourceId'});
  const containersMapById = indexArray(containers, {path: 'resourceId'});
  const containersMapByNamepath = indexArray(containers, {indexer: indexByNamePath});
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapByNamepath = indexArray(targets, {indexer: indexByNamePath});
  const workspaceWrapper: IResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: AppResourceType.Workspace,
  };

  const getEntities = (entity: IPermissionItemInputEntity) => {
    let entities: Record<string, IResourceWrapper> = {};

    // TODO: should we throw error when some entities are not found?
    toArray(entity.entityId).forEach(entityId => {
      entities[entityId] = entitiesMapById[entityId];
    });
    return entities;
  };

  const getContainer = (container: IPermissionItemInputContainer) => {
    let resource: IResourceWrapper | undefined = undefined;

    // TODO: should we throw error when some containers are not found?
    if (container.containerId) resource = containersMapById[container.containerId];

    // Check that it's empty because we are only picking one container
    if (container.folderpath && !resource) resource = containersMapByNamepath[container.folderpath];
    if (container.workspaceRootname && !resource) resource = workspaceWrapper;
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

  type ProcessedPermissionItemInput = {
    container: IResourceWrapper;
    entity: IResourceWrapper;
    action: AppActionType;
    target?: IResourceWrapper;
    targetType?: AppResourceType;
    grantAccess?: boolean;
  };

  const globalEntities = data.entity ? getEntities(data.entity) : {};
  const globalContainer = data.container ? getContainer(data.container) : workspaceWrapper;
  const processedItems: ProcessedPermissionItemInput[] = [];
  const containersToTargetsMap: Record<string, Record<string, IResourceWrapper>> = {};

  data.items.forEach(item => {
    const itemEntitiesMap = item.entity ? merge(getEntities(item.entity), globalEntities) : {};
    const itemContainer = item.container ? getContainer(item.container) : globalContainer;
    const targets = toArray(item.target);
    const itemTargetsMap = toArray(targets)
      .map(getTargets)
      .reduce((map, targets) => merge(map, targets), {});

    forEach(itemEntitiesMap, entity => {
      forEach(itemTargetsMap, target => {
        toArray(item.action).forEach(action => {
          processedItems.push({
            target,
            entity,
            action,
            container: itemContainer,
            grantAccess: item.grantAccess,
          });
        });

        let ccMap = containersToTargetsMap[itemContainer.resourceId];
        if (!ccMap) containersToTargetsMap[itemContainer.resourceId] = ccMap = {};
        ccMap[target.resourceId] = target;
      });

      targets.forEach(target => {
        toArray(target.targetType ?? []).forEach(targetType => {
          toArray(item.action).forEach(action => {
            processedItems.push({
              entity,
              action,
              targetType,
              container: itemContainer,
              grantAccess: item.grantAccess,
            });
          });
        });
      });
    });
  });

  forEach(containersToTargetsMap, (ccMap, containerId) => {
    checkResourcesBelongToContainer(containerId, Object.values(ccMap));
  });

  let inputItems: IPermissionItem[] = processedItems.map(item => {
    const targetType = getTargetType(item);
    return newWorkspaceResource(agent, AppResourceType.PermissionItem, workspace.resourceId, {
      targetType,
      targetId: item.target?.resourceId,
      action: item.action,
      containerId: item.container.resourceId,
      containerType: item.container.resourceType,
      entityId: item.entity.resourceId,
      entityType: item.entity.resourceType,
      grantAccess: item.grantAccess ?? true,
    });
  });

  // Not using transaction read because heavy computation may happen next to
  // filter out existing permission items, and I don't want to keep other
  // permission insertion operations waiting.
  let existingPermissionItems = await context.semantic.permissions.getEntitiesPermissionItems({
    context,
    containerId: extractResourceIdList(containers),
    entityId: extractResourceIdList(entities),
    sortByDate: true,
  });
  ({items: existingPermissionItems} = sortOutPermissionItems(existingPermissionItems));
  ({items: existingPermissionItems} = uniquePermissionItems(
    existingPermissionItems.concat(inputItems)
  ));
  const itemsMap = indexArray(existingPermissionItems, {path: 'resourceId'});
  inputItems = inputItems.filter(item => !!itemsMap[item.resourceId]);
  await context.semantic.permissionItem.insertItem(inputItems, opts);
  return inputItems;
};
