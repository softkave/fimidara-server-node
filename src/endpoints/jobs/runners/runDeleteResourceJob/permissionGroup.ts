import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  genericDeleteArtifacts,
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types.js';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.permissionGroup().deleteOneById(args.resourceId, opts)
  );

export const deletePermissionGroupCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
