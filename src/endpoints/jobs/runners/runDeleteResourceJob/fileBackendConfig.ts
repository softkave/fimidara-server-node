import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = async ({args, helpers}) => {
  const config = await kSemanticModels
    .fileBackendConfig()
    .getOneById(args.resourceId, {includeDeleted: true});

  if (config?.secretId) {
    await kUtilsInjectables.secretsManager().deleteSecret({secretId: config.secretId});
  }

  await helpers.withTxn(opts =>
    kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
  );
};

export const deleteFileBackendConfigCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
