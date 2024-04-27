import {kSemanticModels} from '../../../contexts/injection/injectables';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

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
