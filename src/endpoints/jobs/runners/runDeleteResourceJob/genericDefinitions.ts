import {AnyObject, noopAsync} from 'softkave-js-utils';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
  DeleteResourceGetPreRunMetaFn,
} from './types.js';
import {
  deleteResourceAssignedItemArtifacts,
  deleteResourcePermissionItemArtifacts,
  getResourcePermissionItemArtifacts,
} from './utils.js';

export const noopGetArtifacts: DeleteResourceGetArtifactsToDeleteFns =
  Object.values(kFimidaraResourceType).reduce((acc, type) => {
    acc[type] = null;
    return acc;
  }, {} as DeleteResourceGetArtifactsToDeleteFns);

export const noopDeleteArtifacts: DeleteResourceDeleteArtifactsFns =
  Object.values(kFimidaraResourceType).reduce((acc, type) => {
    acc[type] = null;
    return acc;
  }, {} as DeleteResourceDeleteArtifactsFns);

export const genericGetArtifacts: DeleteResourceGetArtifactsToDeleteFns = {
  ...noopGetArtifacts,
  [kFimidaraResourceType.PermissionItem]: getResourcePermissionItemArtifacts,
};

export const genericDeleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...noopDeleteArtifacts,
  [kFimidaraResourceType.PermissionItem]: deleteResourcePermissionItemArtifacts,
  [kFimidaraResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
};

export const noopDeleteResourceFn: DeleteResourceFn = noopAsync;
export const noopGetPreRunMetaFn: DeleteResourceGetPreRunMetaFn = () =>
  Promise.resolve<AnyObject>({});

export const noopDeleteCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn: noopDeleteResourceFn,
  getArtifactsToDelete: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
