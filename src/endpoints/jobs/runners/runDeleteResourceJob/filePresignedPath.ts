import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericEntries';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.filePresignedPath().deleteOneById(args.resourceId, opts)
  );

export const deleteFilePresignedPathCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  deleteArtifacts: genericDeleteArtifacts,
  getArtifacts: genericGetArtifacts,
};
