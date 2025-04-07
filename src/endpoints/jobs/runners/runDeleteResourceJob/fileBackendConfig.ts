import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {DeleteResourceCascadeFnDefaultArgs} from '../../../../definitions/job.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
} from './genericDefinitions.js';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceFn,
  DeleteResourceGetPreRunMetaFn,
} from './types.js';

interface DeleteFileBackendConfigPreRunMeta {
  secretId?: string;
}

const deleteResourceFn: DeleteResourceFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFileBackendConfigPreRunMeta
> = async ({args, helpers, preRunMeta}) => {
  if (preRunMeta.secretId) {
    await kIjxUtils
      .secretsManager()
      .deleteSecret({secretId: preRunMeta.secretId});
  }

  await helpers.withTxn(opts =>
    kIjxSemantic.fileBackendConfig().deleteOneById(args.resourceId, opts)
  );
};

const getPreRunMetaFn: DeleteResourceGetPreRunMetaFn<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFileBackendConfigPreRunMeta
> = async ({args}) => {
  const config = await kIjxSemantic
    .fileBackendConfig()
    .getOneById(args.resourceId, {includeDeleted: true});

  return {secretId: config?.secretId};
};

export const deleteFileBackendConfigCascadeEntry: DeleteResourceCascadeEntry<
  DeleteResourceCascadeFnDefaultArgs,
  DeleteFileBackendConfigPreRunMeta
> = {
  deleteResourceFn,
  getArtifactsToDelete: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
  getPreRunMetaFn: getPreRunMetaFn,
};
