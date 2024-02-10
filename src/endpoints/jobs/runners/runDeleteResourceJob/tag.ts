import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericEntries';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts => kSemanticModels.tag().deleteOneById(args.resourceId, opts));

export const deleteTagCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
