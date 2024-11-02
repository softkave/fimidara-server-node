import {File} from '../../definitions/file.js';
import {Folder} from '../../definitions/folder.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  ResourceWrapper,
  SessionAgent,
  getWorkspaceResourceTypeList,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {convertToArray} from '../../utils/fns.js';
import {indexArray} from '../../utils/indexArray.js';
import {PartialRecord} from '../../utils/types.js';
import {stringifyFilenamepath} from '../files/utils.js';
import {stringifyFolderpath} from '../folders/utils.js';
import {INTERNAL_getResources} from '../resources/getResources.js';
import {FetchResourceItem} from '../resources/types.js';
import {
  PermissionItemInputTarget,
  ResolvedEntityPermissionItemTarget,
} from './types.js';

export class PermissionItemTargets {
  protected targetsMapById: PartialRecord<string, ResourceWrapper>;
  protected targetsMapByNamepath: PartialRecord<string, ResourceWrapper>;
  protected workspace?: ResourceWrapper;

  constructor(protected resources: ResourceWrapper[]) {
    this.targetsMapById = indexArray(resources, {path: 'resourceId'});
    this.targetsMapByNamepath = indexArray(resources, {
      indexer: this.indexByNamepath,
    });
  }

  getByTarget = (
    target: PermissionItemInputTarget | PermissionItemInputTarget[]
  ) => {
    const targets: Record<
      string,
      ResourceWrapper & ResolvedEntityPermissionItemTarget
    > = {};

    convertToArray(target).forEach(next => {
      // TODO: should we throw error when some targets are not found?
      if (next.targetId) {
        convertToArray(next.targetId).forEach(targetId => {
          const found = this.targetsMapById[targetId];

          if (found) {
            const resolvedTarget: ResourceWrapper &
              ResolvedEntityPermissionItemTarget = found;
            resolvedTarget.targetId = targetId;
            targets[targetId] = resolvedTarget;
          }
        });
      }

      if (next.folderpath) {
        convertToArray(next.folderpath).forEach(folderpath => {
          const folder = this.targetsMapByNamepath[folderpath.toLowerCase()];

          if (folder) {
            const resolvedTarget: ResourceWrapper &
              ResolvedEntityPermissionItemTarget = folder;
            resolvedTarget.folderpath = folderpath;
            targets[folder.resourceId] = resolvedTarget;
          }
        });
      }

      if (next.filepath) {
        convertToArray(next.filepath).forEach(filepath => {
          const file = this.targetsMapByNamepath[filepath.toLowerCase()];

          if (file) {
            const resolvedTarget: ResourceWrapper &
              ResolvedEntityPermissionItemTarget = file;
            resolvedTarget.filepath = filepath;
            targets[file.resourceId] = file;
          }
        });
      }

      if (next.workspaceRootname) {
        const w =
          this.workspace ||
          this.findWorkspaceByRootname(next.workspaceRootname);

        if (w) {
          const resolvedTarget: ResourceWrapper &
            ResolvedEntityPermissionItemTarget = w;
          resolvedTarget.workspaceRootname = next.workspaceRootname;
          targets[w.resourceId] = w;
        }
      }
    });

    return {targets, targetList: Object.values(targets)};
  };

  getResources(): Readonly<ResourceWrapper[]> {
    return this.resources;
  }

  protected indexByNamepath = (item: ResourceWrapper) => {
    if (item.resourceType === kFimidaraResourceType.File) {
      return stringifyFilenamepath(
        item.resource as unknown as File
      ).toLowerCase();
    } else if (item.resourceType === kFimidaraResourceType.Folder) {
      return stringifyFolderpath(
        item.resource as unknown as Folder
      ).toLowerCase();
    } else {
      return '';
    }
  };

  protected findWorkspaceByRootname(rootname: string) {
    const w = this.resources.find(
      resource =>
        resource.resourceType === kFimidaraResourceType.Workspace &&
        (resource.resource as Workspace).rootname.toLowerCase() ===
          rootname.toLowerCase()
    );
    this.workspace = w;
    return w;
  }
}

export async function getPermissionItemTargets(
  agent: SessionAgent,
  workspace: Workspace,
  target:
    | Partial<PermissionItemInputTarget>
    | Partial<PermissionItemInputTarget>[],
  action: FimidaraPermissionAction
) {
  const resources = await INTERNAL_getResources({
    agent,
    workspaceId: workspace.resourceId,
    allowedTypes: getWorkspaceResourceTypeList(),
    inputResources: convertToArray(target).map(
      (nextTarget): FetchResourceItem => {
        return {
          action,
          resourceId: nextTarget.targetId,
          filepath: nextTarget.filepath,
          folderpath: nextTarget.folderpath,
          workspaceRootname: nextTarget.workspaceRootname,
        };
      }
    ),
    checkAuth: true,
    checkBelongsToWorkspace: true,
  });

  return new PermissionItemTargets(resources);
}
