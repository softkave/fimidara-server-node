import {kAppResourceType} from '../../../../definitions/system';
import {noopAsync} from '../../../../utils/fns';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteSimpleArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetComplexArtifactsFns,
} from './types';

export const noopGetComplexArtifacts: DeleteResourceGetComplexArtifactsFns =
  Object.values(kAppResourceType).reduce((acc, type) => {
    acc[type] = null;
    return acc;
  }, {} as DeleteResourceGetComplexArtifactsFns);

export const noopDeleteSimpleArtifacts: DeleteResourceDeleteSimpleArtifactsFns =
  Object.values(kAppResourceType).reduce((acc, type) => {
    acc[type] = null;
    return acc;
  }, {} as DeleteResourceDeleteSimpleArtifactsFns);

export const noopDeleteResourceFn: DeleteResourceFn = noopAsync;

export const deleteNoopCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn: noopDeleteResourceFn,
  getComplexArtifacts: noopGetComplexArtifacts,
  deleteSimpleArtifacts: noopDeleteSimpleArtifacts,
};
