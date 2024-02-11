import {kAppResourceType} from '../../../../definitions/system';
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
  kAppResourceType
).reduce((acc, type) => {
  acc[type] = null;
  return acc;
}, {} as DeleteResourceGetArtifactsFns);

export const noopDeleteArtifacts: DeleteResourceDeleteArtifactsFns = Object.values(
  kAppResourceType
).reduce((acc, type) => {
  acc[type] = null;
  return acc;
}, {} as DeleteResourceDeleteArtifactsFns);

export const genericGetArtifacts: DeleteResourceGetArtifactsFns = {
  ...noopGetArtifacts,
  [kAppResourceType.PermissionItem]: getResourcePermissionItemArtifacts,
};

export const genericDeleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...noopDeleteArtifacts,
  [kAppResourceType.PermissionItem]: deleteResourcePermissionItemArtifacts,
  [kAppResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
};

export const noopDeleteResourceFn: DeleteResourceFn = noopAsync;

export const noopDeleteCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn: noopDeleteResourceFn,
  getArtifacts: genericGetArtifacts,
  deleteArtifacts: genericDeleteArtifacts,
};
