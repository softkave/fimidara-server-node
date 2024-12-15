import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables.js';
import {UsageRecordDecrementInput} from '../../../../contexts/usage/types.js';
import {ResolvedMountEntry} from '../../../../definitions/fileBackend.js';
import {DeleteResourceCascadeFnDefaultArgs} from '../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {kUsageRecordCategory} from '../../../../definitions/usageRecord.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils.js';
import {FileQueries} from '../../../files/queries.js';
import {stringifyFilenamepath} from '../../../files/utils.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
} from './genericDefinitions.js';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
  DeleteResourceGetPreRunMetaFn,
} from './types.js';

interface DeleteFilePreRunMeta {
  partialMountEntries: Array<
    Pick<ResolvedMountEntry, 'backendNamepath' | 'backendExt'>
  >;
  namepath?: string[];
  ext?: string;
  size?: number;
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
  [kFimidaraResourceType.ResolvedMountEntry]: async ({
    args,
    helpers,
    preRunMeta,
  }) =>
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

async function deleteMountFiles(params: {
  workspaceId: string;
  namepath: string[];
  resourceId: string;
  partialMountEntries: Array<
    Pick<ResolvedMountEntry, 'backendNamepath' | 'backendExt'>
  >;
}) {
  const {providersMap, mounts} = await resolveBackendsMountsAndConfigs(
    /** file */ {workspaceId: params.workspaceId, namepath: params.namepath},
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
          workspaceId: params.workspaceId,
          files: params.partialMountEntries.map(partialMountEntry => ({
            fileId: params.resourceId,
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
}

async function decrementStorageUsageRecordForFile(params: {
  workspaceId: string;
  size?: number;
}) {
  const {workspaceId, size} = params;
  if (!size) {
    return;
  }

  const input: UsageRecordDecrementInput = {
    workspaceId,
    category: kUsageRecordCategory.storage,
    usage: size,
  };

  await kUtilsInjectables.usage().decrement(kSystemSessionAgent, input);
}

const deleteResourceFn: DeleteResourceFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = async ({args, helpers, preRunMeta}) => {
  if (!preRunMeta.namepath) {
    return;
  }

  await Promise.all([
    deleteMountFiles({
      workspaceId: args.workspaceId,
      namepath: preRunMeta.namepath,
      resourceId: args.resourceId,
      partialMountEntries: preRunMeta.partialMountEntries,
    }),
    decrementStorageUsageRecordForFile({
      workspaceId: args.workspaceId,
      size: preRunMeta.size,
    }),
  ]);

  await helpers.withTxn(async opts => {
    await kSemanticModels.file().deleteOneById(args.resourceId, opts);
  });
};

const getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = async ({args}) => {
  const keys: Array<keyof DeleteFilePreRunMeta['partialMountEntries'][number]> =
    ['backendExt', 'backendNamepath'];
  const [partialMountEntries, file] = await Promise.all([
    kSemanticModels.resolvedMountEntry().getLatestByForId(args.resourceId, {
      projection: keys.reduce((acc, key) => ({...acc, [key]: true}), {}),
    }),
    kSemanticModels.file().getOneById(args.resourceId, {includeDeleted: true}),
  ]);

  return {
    partialMountEntries,
    namepath: file?.namepath,
    ext: file?.ext,
    size: file?.size,
  };
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
