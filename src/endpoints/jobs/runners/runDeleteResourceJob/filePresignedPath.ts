import {kSemanticModels} from '../../../contexts/injection/injectables';
import {noopDeleteSimpleArtifacts, noopGetComplexArtifacts} from './noop';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.filePresignedPath().deleteOneById(args.resourceId, opts)
  );

export const deleteFilePresignedPathCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  deleteSimpleArtifacts: noopDeleteSimpleArtifacts,
  getComplexArtifacts: noopGetComplexArtifacts,
};
