import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types.js';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels
      .assignedItem()
      .deleteByAssignee(args.workspaceId, args.resourceId, opts)
  );

export const deleteCollaboratorCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
