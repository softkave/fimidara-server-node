import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteByAssignee(args.workspaceId, args.resourceId, opts)
  );

export const deleteCollaboratorCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
