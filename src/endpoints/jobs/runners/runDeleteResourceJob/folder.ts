import {pathJoin} from 'softkave-js-utils';
import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {DeleteResourceCascadeFnDefaultArgs} from '../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils';
import {FolderQueries} from '../../../folders/queries';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
  DeleteResourceGetPreRunMetaFn,
} from './types';

interface DeleteFolderPreRunMeta {
  partialMountEntries: Array<Pick<ResolvedMountEntry, 'backendNamepath'>>;
  namepath?: string[];
}

const getArtifacts: DeleteResourceGetArtifactsToDeleteFns = {
  ...genericGetArtifacts,
  [kFimidaraResourceType.Folder]: async ({args, opts}) => {
    return await kSemanticModels.folder().getManyByQuery(
      FolderQueries.getByParentId({
        workspaceId: args.workspaceId,
        resourceId: args.resourceId,
      }),
      opts
    );
  },
  [kFimidaraResourceType.File]: async ({args, opts}) => {
    return await kSemanticModels.file().getManyByQuery(
      FolderQueries.getByParentId({
        workspaceId: args.workspaceId,
        resourceId: args.resourceId,
      }),
      opts
    );
  },
};

const deleteResourceFn: DeleteResourceFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFolderPreRunMeta
> = async ({args, helpers, preRunMeta}) => {
  if (!preRunMeta.namepath) {
    return;
  }

  const {providersMap, mounts} = await resolveBackendsMountsAndConfigs(
    /** folder */ {workspaceId: args.workspaceId, namepath: preRunMeta.namepath},
    /** init primary backend only */ false
  );
  await Promise.all(
    mounts.map(async mount => {
      try {
        const provider = providersMap[mount.resourceId];
        // TODO: if we're deleting a folder, do we then need to delete
        // children folder and files too, or won't that be taken care of here?
        // A possible way to save on cost for backends that support deleting
        // folders
        await provider?.deleteFolders({
          mount,
          workspaceId: args.workspaceId,
          folders: preRunMeta.partialMountEntries.map(partialMountEntry => ({
            folderpath: pathJoin({input: partialMountEntry.backendNamepath}),
          })),
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

const getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFolderPreRunMeta
> = async ({args}) => {
  const keys: Array<keyof DeleteFolderPreRunMeta['partialMountEntries'][number]> = [
    'backendNamepath',
  ];
  const [partialMountEntries, folder] = await Promise.all([
    kSemanticModels.resolvedMountEntry().getLatestByForId(args.resourceId, {
      projection: keys.reduce((acc, key) => ({...acc, [key]: true}), {}),
    }),
    kSemanticModels.folder().getOneById(args.resourceId, {includeDeleted: true}),
  ]);

  return {partialMountEntries, namepath: folder?.namepath};
};

export const deleteFolderCascadeEntry: DeleteResourceCascadeEntry<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFolderPreRunMeta
> = {
  deleteResourceFn,
  getPreRunMetaFn,
  getArtifactsToDelete: getArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
