import {kAppResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injectables';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils';
import {kFolderConstants} from '../../../folders/constants';
import {FolderQueries} from '../../../folders/queries';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteSimpleArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetComplexArtifactsFns,
} from './types';
import {
  deleteResourceAssignedItemArtifacts,
  getResourcePermissionItemArtifacts,
} from './utils';

const getComplexArtifacts: DeleteResourceGetComplexArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Workspace]: null,
  [kAppResourceType.CollaborationRequest]: null,
  [kAppResourceType.AgentToken]: null,
  [kAppResourceType.PermissionGroup]: null,
  [kAppResourceType.Tag]: null,
  [kAppResourceType.UsageRecord]: null,
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.AssignedItem]: null,
  [kAppResourceType.ResolvedMountEntry]: null,
  [kAppResourceType.FilePresignedPath]: null,
  [kAppResourceType.PermissionItem]: getResourcePermissionItemArtifacts,
  [kAppResourceType.Folder]: async ({args, opts}) => {
    const folder = await kSemanticModels.folder().getOneById(args.resourceId);

    if (folder) {
      return await kSemanticModels
        .folder()
        .getManyByQuery(FolderQueries.getByParentId(folder), opts);
    }

    return [];
  },
  [kAppResourceType.File]: async ({args, opts}) => {
    const folder = await kSemanticModels.folder().getOneById(args.resourceId);

    if (folder) {
      return await kSemanticModels
        .file()
        .getManyByQuery(FolderQueries.getByParentId(folder), opts);
    }

    return [];
  },
};

const deleteSimpleArtifacts: DeleteResourceDeleteSimpleArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Workspace]: null,
  [kAppResourceType.CollaborationRequest]: null,
  [kAppResourceType.AgentToken]: null,
  [kAppResourceType.PermissionGroup]: null,
  [kAppResourceType.Folder]: null,
  [kAppResourceType.File]: null,
  [kAppResourceType.Tag]: null,
  [kAppResourceType.UsageRecord]: null,
  [kAppResourceType.FilePresignedPath]: null,
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.PermissionItem]: null,
  [kAppResourceType.ResolvedMountEntry]: null,
  [kAppResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
  other: async ({args}) => {
    const folder = await kSemanticModels.folder().getOneById(args.resourceId);

    if (folder) {
      const folderpath = folder.namepath.join(kFolderConstants.separator);
      const {providersMap, mounts} = await resolveBackendsMountsAndConfigs(folder);
      await Promise.all(
        mounts.map(mount => {
          const provider = providersMap[mount.resourceId];
          // TODO: if we're deleting a folder, do we then need to delete
          // children folder and files too, or won't that be taken care of here?
          // A possible way to save on cost for backends that support deleting
          // folders
          return provider.deleteFolders({
            mount,
            folderpaths: [folderpath],
            workspaceId: folder.workspaceId,
          });
        })
      );
    }
  },
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts => kSemanticModels.folder().deleteOneById(args.resourceId, opts));

export const deleteFolderCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getComplexArtifacts,
  deleteSimpleArtifacts,
};
