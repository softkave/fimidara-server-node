import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types.js';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.presignedPath().deleteOneById(args.resourceId, opts)
  );

export const deletePresignedPathCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  deleteArtifacts: genericDeleteArtifacts,
  getArtifactsToDelete: genericGetArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
