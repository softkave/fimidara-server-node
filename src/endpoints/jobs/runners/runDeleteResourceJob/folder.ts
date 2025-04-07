import {pathJoin} from 'softkave-js-utils';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {ResolvedMountEntry} from '../../../../definitions/fileBackend.js';
import {DeleteResourceCascadeFnDefaultArgs} from '../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils.js';
import {FolderQueries} from '../../../folders/queries.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
} from './genericDefinitions.js';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
  DeleteResourceGetPreRunMetaFn,
} from './types.js';

interface DeleteFolderPreRunMeta {
  partialMountEntries: Array<Pick<ResolvedMountEntry, 'backendNamepath'>>;
  namepath?: string[];
}

const getArtifacts: DeleteResourceGetArtifactsToDeleteFns = {
  ...genericGetArtifacts,
  [kFimidaraResourceType.Folder]: async ({args, opts}) => {
    return await kIjxSemantic.folder().getManyByQuery(
      FolderQueries.getByParentId({
        workspaceId: args.workspaceId,
        resourceId: args.resourceId,
      }),
      opts
    );
  },
  [kFimidaraResourceType.File]: async ({args, opts}) => {
    return await kIjxSemantic.file().getManyByQuery(
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

  const {providersMap, mounts} = await resolveBackendsMountsAndConfigs({
    file: {workspaceId: args.workspaceId, namepath: preRunMeta.namepath},
    initPrimaryBackendOnly: false,
  });

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
        kIjxUtils.logger().error(error);
      }
    })
  );

  await helpers.withTxn(opts =>
    kIjxSemantic.folder().deleteOneById(args.resourceId, opts)
  );
};

const getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFolderPreRunMeta
> = async ({args}) => {
  const keys: Array<
    keyof DeleteFolderPreRunMeta['partialMountEntries'][number]
  > = ['backendNamepath'];
  const [partialMountEntries, folder] = await Promise.all([
    kIjxSemantic.resolvedMountEntry().getLatestByForId(args.resourceId, {
      projection: keys.reduce((acc, key) => ({...acc, [key]: true}), {}),
    }),
    kIjxSemantic.folder().getOneById(args.resourceId, {includeDeleted: true}),
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
