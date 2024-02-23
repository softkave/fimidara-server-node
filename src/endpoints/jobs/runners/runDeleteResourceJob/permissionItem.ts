import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {DeleteResourceCascadeEntry, DeleteResourceFn} from './types';

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.permissionItem().deleteOneById(args.resourceId, opts)
  );

export const deletePermissionItemCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
