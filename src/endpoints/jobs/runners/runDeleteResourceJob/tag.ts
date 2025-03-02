import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types.js';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kIjxSemantic.tag().deleteOneById(args.resourceId, opts)
  );

export const deleteTagCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
