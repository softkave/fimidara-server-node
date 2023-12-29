import {flatten, forEach} from 'lodash';
import {Promise} from 'mongoose';
import {File} from '../../../definitions/file';
import {PermissionItem} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  ResourceWrapper,
  SessionAgent,
  kAppResourceType,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {extractResourceIdList, isObjectEmpty, toArray} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {GetTypeFromTypeOrArray} from '../../../utils/types';
import {DataQuery} from '../../contexts/data/types';
import {getInAndNinQuery} from '../../contexts/semantic/utils';
import {kFolderConstants} from '../../folders/constants';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {PermissionItemInputTarget} from '../types';
import {getPermissionItemTargets} from '../utils';
import {DeletePermissionItemInput, DeletePermissionItemsEndpointParams} from './types';
import {kSemanticModels} from '../../contexts/injectables';

export const INTERNAL_deletePermissionItems = async (
  agent: SessionAgent,
  workspace: Workspace,
  data: DeletePermissionItemsEndpointParams
) => {
  let inputTargets: Partial<PermissionItemInputTarget>[] = [];

  // Extract out targets
  data.items?.forEach(item => {
    if (item.target) inputTargets = inputTargets.concat(toArray(item.target));
  });

  // Fetch targets
  const [targets] = await Promise.all([
    getPermissionItemTargets(agent, workspace, inputTargets),
  ]);

  // For indexing files and folders by name path
  const indexBynamepath = (item: ResourceWrapper) => {
    if (
      item.resourceType === kAppResourceType.File ||
      item.resourceType === kAppResourceType.Folder
    )
      return (item.resource as unknown as Pick<File, 'namepath'>).namepath.join(
        kFolderConstants.separator
      );
    else return '';
  };

  // Index targets by ID and name path (for files and folders). This is for fast
  // retrieval later down the line.
  const targetsMapById = indexArray(targets, {path: 'resourceId'});
  const targetsMapBynamepath = indexArray(targets, {indexer: indexBynamepath});
  const workspaceWrapper: ResourceWrapper = {
    resource: workspace,
    resourceId: workspace.resourceId,
    resourceType: kAppResourceType.Workspace,
  };

  const getTargets = (
    target: GetTypeFromTypeOrArray<DeletePermissionItemInput['target']>
  ) => {
    const targets: Record<string, ResourceWrapper> = {};

    // TODO: should we throw error when some targets are not found?
    if (target.targetId) {
      toArray(target.targetId).forEach(targetId => {
        if (targetsMapById[targetId]) targets[targetId] = targetsMapById[targetId];
      });
    }

    if (target.folderpath) {
      toArray(target.folderpath).forEach(folderpath => {
        const folder = targetsMapBynamepath[folderpath];
        if (folder) targets[folder.resourceId] = folder;
      });
    }

    if (target.filepath) {
      toArray(target.filepath).forEach(filepath => {
        const file = targetsMapBynamepath[filepath];
        if (file) targets[file.resourceId] = file;
      });
    }

    if (target.workspaceRootname) {
      targets[workspace.resourceId] = workspaceWrapper;
    }

    return targets;
  };

  const resolvedInputsMap: {
    targetsMap: Record<
      /** target ID */ string,
      {resource: ResourceWrapper; item: DeletePermissionItemInput}
    >;
    targetTypesMap: Record</** target type */ string, {item: DeletePermissionItemInput}>;
  } = {targetsMap: {}, targetTypesMap: {}};

  const insertIntoContainerTargetsMap = (
    resource: ResourceWrapper,
    item: DeletePermissionItemInput
  ) => {
    resolvedInputsMap.targetsMap[resource.resourceId] = {
      resource,
      item,
    };
  };

  if (data.items) {
    data.items.forEach(item => {
      const targets = toArray(item.target ?? []);
      targets.forEach(target => {
        const itemTargetsMap = getTargets(target);

        if (!isObjectEmpty(itemTargetsMap)) {
          forEach(itemTargetsMap, targetResource => {
            insertIntoContainerTargetsMap(targetResource, item);
          });
        }
      });
    });
  }

  const queries: DataQuery<PermissionItem>[] = [];

  forEach(resolvedInputsMap.targetsMap, targetEntry => {
    const query: DataQuery<PermissionItem> = {
      targetId: targetEntry.resource.resourceId,
      ...getInAndNinQuery<PermissionItem>('access', targetEntry.item.access),
      ...getInAndNinQuery<PermissionItem>('action', targetEntry.item.action),
      ...getInAndNinQuery<PermissionItem>('entityId', targetEntry.item.entityId),
    };
    queries.push(query);
  });

  forEach(resolvedInputsMap.targetTypesMap, ({item}, targetType) => {
    const query: DataQuery<PermissionItem> = {
      targetType: targetType as AppResourceType,
      ...getInAndNinQuery<PermissionItem>('access', item.access),
      ...getInAndNinQuery<PermissionItem>('action', item.action),
      ...getInAndNinQuery<PermissionItem>('entityId', item.entityId),
    };
    queries.push(query);
  });

  if (!queries.length) {
    return;
  }

  // TODO: deleting one after the other may not be the best way to go here
  const result: PermissionItem[] = await Promise.all(
    queries.map(query => kSemanticModels.permissionItem().getManyByQuery(query))
  );
  const permissionItems = flatten(result);
  const permissionItemsIdList = extractResourceIdList(permissionItems);

  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.PermissionItem,
    args: {permissionItemsIdList, workspaceId: workspace.resourceId},
  });

  return job;
};
