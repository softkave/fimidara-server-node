import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types.js';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kIjxSemantic.collaborationRequest().deleteOneById(args.resourceId, opts)
  );

export const deleteCollaborationRequestCascadeEntry: DeleteResourceCascadeEntry =
  {
    deleteResourceFn,
    getArtifactsToDelete: genericGetArtifacts,
    deleteArtifacts: genericDeleteArtifacts,
    getPreRunMetaFn: noopGetPreRunMetaFn,
  };
