import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericEntries';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.collaborationRequest().deleteOneById(args.resourceId, opts)
  );

export const deleteCollaborationRequestCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
