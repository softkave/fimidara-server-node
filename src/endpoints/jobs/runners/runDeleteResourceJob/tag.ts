import {kSemanticModels} from '../../../contexts/injection/injectables';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts => kSemanticModels.tag().deleteOneById(args.resourceId, opts));

export const deleteTagCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
