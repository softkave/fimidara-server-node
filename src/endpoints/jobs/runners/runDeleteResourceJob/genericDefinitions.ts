import {kFimidaraResourceType} from '../../../../definitions/system';
import {noopAsync} from '../../../../utils/fns';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';
import {
  deleteResourceAssignedItemArtifacts,
  deleteResourcePermissionItemArtifacts,
  getResourcePermissionItemArtifacts,
} from './utils';

export const noopGetArtifacts: DeleteResourceGetArtifactsFns = Object.values(
  kFimidaraResourceType
).reduce((acc, type) => {
  acc[type] = null;
  return acc;
}, {} as DeleteResourceGetArtifactsFns);

export const noopDeleteArtifacts: DeleteResourceDeleteArtifactsFns = Object.values(
  kFimidaraResourceType
).reduce((acc, type) => {
  acc[type] = null;
  return acc;
}, {} as DeleteResourceDeleteArtifactsFns);

export const genericGetArtifacts: DeleteResourceGetArtifactsFns = {
  ...noopGetArtifacts,
  [kFimidaraResourceType.PermissionItem]: getResourcePermissionItemArtifacts,
};

export const genericDeleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...noopDeleteArtifacts,
  [kFimidaraResourceType.PermissionItem]: deleteResourcePermissionItemArtifacts,
  [kFimidaraResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
};

export const noopDeleteResourceFn: DeleteResourceFn = noopAsync;

export const noopDeleteCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn: noopDeleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
