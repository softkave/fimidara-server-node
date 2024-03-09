import {kFimidaraResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';

const getArtifacts: DeleteResourceGetArtifactsFns = {
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
  getArtifacts: getArtifacts,
  deleteArtifacts: deleteArtifacts,
};
