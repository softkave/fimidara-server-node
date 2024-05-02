import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
} from './types.js';

const getArtifacts: DeleteResourceGetArtifactsToDeleteFns = {
  ...genericGetArtifacts,
  [kFimidaraResourceType.ResolvedMountEntry]: ({args}) =>
    kSemanticModels.resolvedMountEntry().getManyByQuery({mountId: args.resourceId}),
  // TODO: should we delete files from mount?
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...genericDeleteArtifacts,
  [kFimidaraResourceType.ResolvedMountEntry]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .resolvedMountEntry()
        .deleteManyByQuery({mountId: args.resourceId}, opts)
    ),
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.fileBackendMount().deleteOneById(args.resourceId, opts)
  );

export const deleteFileBackendMountCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: getArtifacts,
  deleteArtifacts: deleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
