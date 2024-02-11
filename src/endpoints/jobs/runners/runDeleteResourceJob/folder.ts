import {kAppResourceType} from '../../../../definitions/system';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils';
import {FolderQueries} from '../../../folders/queries';
import {stringifyFoldernamepath} from '../../../folders/utils';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';

const getArtifacts: DeleteResourceGetArtifactsFns = {
  ...genericGetArtifacts,
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

const deleteResourceFn: DeleteResourceFn = async ({args, helpers}) => {
  const folder = await kSemanticModels.folder().getOneById(args.resourceId);

  if (!folder) {
    return;
  }

  const folderpath = stringifyFoldernamepath(folder);
  const {providersMap, mounts} = await resolveBackendsMountsAndConfigs(folder);
  await Promise.all(
    mounts.map(async mount => {
      try {
        const provider = providersMap[mount.resourceId];
        // TODO: if we're deleting a folder, do we then need to delete
        // children folder and files too, or won't that be taken care of here?
        // A possible way to save on cost for backends that support deleting
        // folders
        await provider.deleteFolders({
          mount,
          folderpaths: [folderpath],
          workspaceId: folder.workspaceId,
        });
      } catch (error) {
        kUtilsInjectables.logger().error(error);
      }
    })
  );

  await helpers.withTxn(opts =>
    kSemanticModels.folder().deleteOneById(args.resourceId, opts)
  );
};

export const deleteFolderCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: getArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
