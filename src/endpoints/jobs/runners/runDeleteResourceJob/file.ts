import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {DeleteResourceCascadeFnDefaultArgs} from '../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils';
import {FileQueries} from '../../../files/queries';
import {stringifyFilenamepath} from '../../../files/utils';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
  DeleteResourceGetPreRunMetaFn,
} from './types';

interface DeleteFilePreRunMeta {
  partialMountEntries: Array<Pick<ResolvedMountEntry, 'backendNamepath' | 'backendExt'>>;
  namepath?: string[];
  ext?: string;
}

const getArtifacts: DeleteResourceGetArtifactsToDeleteFns<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = {
  ...genericGetArtifacts,
  [kFimidaraResourceType.PresignedPath]: async ({args, opts, preRunMeta}) => {
    if (preRunMeta.namepath) {
      return await kSemanticModels.presignedPath().getManyByQuery(
        FileQueries.getByNamepath({
          workspaceId: args.workspaceId,
          namepath: preRunMeta.namepath,
          ext: preRunMeta.ext,
        }),
        opts
      );
    }

    return [];
  },
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = {
  ...genericDeleteArtifacts,
  [kFimidaraResourceType.ResolvedMountEntry]: async ({args, helpers, preRunMeta}) =>
    helpers.withTxn(async opts => {
      if (preRunMeta.namepath) {
        await kSemanticModels.resolvedMountEntry().deleteManyByQuery(
          FileQueries.getByNamepath({
            workspaceId: args.workspaceId,
            namepath: preRunMeta.namepath,
            ext: preRunMeta.ext,
          }),
          opts
        );
      }
    }),
};

const deleteResourceFn: DeleteResourceFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = async ({args, helpers, preRunMeta}) => {
  if (!preRunMeta.namepath) {
    return;
  }

  const {providersMap, mounts} = await resolveBackendsMountsAndConfigs(
    /** file */ {workspaceId: args.workspaceId, namepath: preRunMeta.namepath},
    /** init primary backend only */ false
  );
  await Promise.all(
    mounts.map(async mount => {
      try {
        const provider = providersMap[mount.resourceId];
        // TODO: if we're deleting the parent folder, for jobs created from a
        // parent folder, do we still need to delete the file, for backends
        // that support deleting folders?
        await provider?.deleteFiles({
          mount,
          workspaceId: args.workspaceId,
          files: preRunMeta.partialMountEntries.map(partialMountEntry => ({
            fileId: args.resourceId,
            filepath: stringifyFilenamepath({
              namepath: partialMountEntry.backendNamepath,
              ext: partialMountEntry.backendExt,
            }),
          })),
        });
      } catch (error) {
        kUtilsInjectables.logger().error(error);
      }
    })
  );

  await helpers.withTxn(async opts => {
    await kSemanticModels.file().deleteOneById(args.resourceId, opts);
  });
};

const getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = async ({args}) => {
  const keys: Array<keyof DeleteFilePreRunMeta['partialMountEntries'][number]> = [
    'backendExt',
    'backendNamepath',
  ];
  const [partialMountEntries, file] = await Promise.all([
    kSemanticModels.resolvedMountEntry().getLatestByForId(args.resourceId, {
      projection: keys.reduce((acc, key) => ({...acc, [key]: true}), {}),
    }),
    kSemanticModels.file().getOneById(args.resourceId, {includeDeleted: true}),
  ]);

  return {partialMountEntries, namepath: file?.namepath, ext: file?.ext};
};

export const deleteFileCascadeEntry: DeleteResourceCascadeEntry<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = {
  deleteResourceFn,
  getPreRunMetaFn,
  getArtifactsToDelete: getArtifacts,
  deleteArtifacts: deleteArtifacts,
};
