import {
  FilePersistenceProvider,
  IFilePersistenceProviderMount,
} from '../../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
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
  multipartId: string | null | undefined;
}

const getArtifacts: DeleteResourceGetArtifactsToDeleteFns<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = {
  ...genericGetArtifacts,
  [kFimidaraResourceType.PresignedPath]: async ({args, opts, preRunMeta}) => {
    if (preRunMeta.namepath) {
      return await kIjxSemantic.presignedPath().getManyByQuery(
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
  [kFimidaraResourceType.filePart]: async () => [],
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
        await Promise.all([
          kIjxSemantic.resolvedMountEntry().deleteManyByQuery(
            FileQueries.getByNamepath({
              workspaceId: args.workspaceId,
              namepath: preRunMeta.namepath,
              ext: preRunMeta.ext,
            }),
            opts
          ),
          kIjxSemantic.filePart().deleteManyByFileId(args.resourceId, opts),
        ]);
      }
    }),
  [kFimidaraResourceType.filePart]: async () => [],
};

async function cleanupMultipartEntry(params: {
  provider: FilePersistenceProvider;
  mount: IFilePersistenceProviderMount;
  fileId: string;
  workspaceId: string;
  mountFilepath: string;
  multipartId: string;
}) {
  await params.provider?.cleanupMultipartUpload({
    mount: params.mount,
    fileId: params.fileId,
    workspaceId: params.workspaceId,
    filepath: params.mountFilepath,
    multipartId: params.multipartId,
  });
}

// TODO: split into multiple jobs
async function cleanupMultipartEntries(params: {
  provider: FilePersistenceProvider;
  mount: IFilePersistenceProviderMount;
  fileId: string;
  workspaceId: string;
  mountFilepaths: string[];
  multipartId: string;
}) {
  await Promise.all(
    params.mountFilepaths.map(mountFilepath =>
      cleanupMultipartEntry({...params, mountFilepath})
    )
  );
}

async function deleteMountFileEntries(params: {
  provider: FilePersistenceProvider;
  mount: IFilePersistenceProviderMount;
  workspaceId: string;
  resourceId: string;
  partialMountEntries: Array<
    Pick<ResolvedMountEntry, 'backendNamepath' | 'backendExt'>
  >;
}) {
  await params.provider?.deleteFiles({
    mount: params.mount,
    workspaceId: params.workspaceId,
    files: params.partialMountEntries.map(entry => ({
      fileId: params.resourceId,
      filepath: stringifyFilenamepath({
        namepath: entry.backendNamepath,
        ext: entry.backendExt,
      }),
    })),
  });
}

async function deleteMountFileArtifacts(params: {
  workspaceId: string;
  namepath: string[];
  resourceId: string;
  partialMountEntries: Array<
    Pick<ResolvedMountEntry, 'backendNamepath' | 'backendExt'>
  >;
  multipartId?: string;
}) {
  const {providersMap, mounts} = await resolveBackendsMountsAndConfigs({
    file: {workspaceId: params.workspaceId, namepath: params.namepath},
    initPrimaryBackendOnly: false,
  });

  await Promise.all(
    mounts.map(async mount => {
      try {
        const provider = providersMap[mount.resourceId];
        if (!provider) {
          return;
        }

        // TODO: if we're deleting the parent folder, for jobs created from a
        // parent folder, do we still need to delete the file, for backends
        // that support deleting folders?
        await Promise.all([
          deleteMountFileEntries({
            provider,
            mount,
            workspaceId: params.workspaceId,
            resourceId: params.resourceId,
            partialMountEntries: params.partialMountEntries,
          }),

          // TODO: for fanout, each backend will have its own multipartId, so
          // we'll need to implement this for each backend
          params.multipartId &&
            cleanupMultipartEntries({
              provider,
              mount,
              workspaceId: params.workspaceId,
              fileId: params.resourceId,
              mountFilepaths: params.partialMountEntries.map(entry =>
                stringifyFilenamepath({
                  namepath: entry.backendNamepath,
                  ext: entry.backendExt,
                })
              ),
              multipartId: params.multipartId,
            }),
        ]);
      } catch (error) {
        kIjxUtils.logger().error(error);
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

  await kIjxUtils.usage().decrement(kSystemSessionAgent, input);
}

const deleteResourceFn: DeleteResourceFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = async ({args, helpers, preRunMeta}) => {
  if (!preRunMeta.namepath) {
    return;
  }

  await Promise.all([
    deleteMountFileArtifacts({
      workspaceId: args.workspaceId,
      namepath: preRunMeta.namepath,
      resourceId: args.resourceId,
      partialMountEntries: preRunMeta.partialMountEntries,
      multipartId: preRunMeta.multipartId ?? undefined,
    }),
    decrementStorageUsageRecordForFile({
      workspaceId: args.workspaceId,
      size: preRunMeta.size,
    }),
  ]);

  await helpers.withTxn(async opts => {
    await kIjxSemantic.file().deleteOneById(args.resourceId, opts);
  });
};

const getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFilePreRunMeta
> = async ({args}) => {
  const keys: Array<keyof DeleteFilePreRunMeta['partialMountEntries'][number]> =
    ['backendExt', 'backendNamepath'];
  const [partialMountEntries, file] = await Promise.all([
    kIjxSemantic.resolvedMountEntry().getLatestByForId(args.resourceId, {
      projection: keys.reduce((acc, key) => ({...acc, [key]: true}), {}),
    }),
    kIjxSemantic.file().getOneById(args.resourceId, {includeDeleted: true}),
  ]);

  return {
    partialMountEntries,
    namepath: file?.namepath,
    ext: file?.ext,
    size: file?.size,
    multipartId: file?.internalMultipartId,
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
