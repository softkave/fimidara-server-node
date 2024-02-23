import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddFileBackendConfigEndpoint} from './addConfig/types';
import {AddFileBackendMountEndpoint} from './addMount/types';
import {CountFileBackendConfigsEndpoint} from './countConfigs/types';
import {CountFileBackendMountsEndpoint} from './countMounts/types';
import {DeleteFileBackendConfigEndpoint} from './deleteConfig/types';
import {DeleteFileBackendMountEndpoint} from './deleteMount/types';
import {GetFileBackendConfigEndpoint} from './getConfig/types';
import {GetFileBackendConfigsEndpoint} from './getConfigs/types';
import {GetFileBackendMountEndpoint} from './getMount/types';
import {GetFileBackendMountsEndpoint} from './getMounts/types';
import {ResolveFileBackendMountsEndpoint} from './resolveMounts/types';
import {UpdateFileBackendConfigEndpoint} from './updateConfig/types';
import {UpdateFileBackendMountEndpoint} from './updateMount/types';

export type AddFileBackendMountHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddFileBackendMountEndpoint>;
export type DeleteFileBackendMountHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteFileBackendMountEndpoint>;
export type GetFileBackendMountsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileBackendMountsEndpoint>;
export type CountFileBackendMountsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountFileBackendMountsEndpoint>;
export type GetFileBackendMountHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileBackendMountEndpoint>;
export type UpdateFileBackendMountHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateFileBackendMountEndpoint>;
export type ResolveFileBackendMountsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ResolveFileBackendMountsEndpoint>;

export type AddFileBackendConfigHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddFileBackendConfigEndpoint>;
export type DeleteFileBackendConfigHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteFileBackendConfigEndpoint>;
export type GetFileBackendConfigsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileBackendConfigsEndpoint>;
export type CountFileBackendConfigsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountFileBackendConfigsEndpoint>;
export type GetFileBackendConfigHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileBackendConfigEndpoint>;
export type UpdateFileBackendConfigHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateFileBackendConfigEndpoint>;

export type FileBackendsExportedEndpoints = {
  addMount: AddFileBackendMountHttpEndpoint;
  deleteMount: DeleteFileBackendMountHttpEndpoint;
  getMounts: GetFileBackendMountsHttpEndpoint;
  countMounts: CountFileBackendMountsHttpEndpoint;
  getMount: GetFileBackendMountHttpEndpoint;
  updateMount: UpdateFileBackendMountHttpEndpoint;
  resolveMounts: ResolveFileBackendMountsHttpEndpoint;

  addConfig: AddFileBackendConfigHttpEndpoint;
  deleteConfig: DeleteFileBackendConfigHttpEndpoint;
  getConfigs: GetFileBackendConfigsHttpEndpoint;
  countConfigs: CountFileBackendConfigsHttpEndpoint;
  getConfig: GetFileBackendConfigHttpEndpoint;
  updateConfig: UpdateFileBackendConfigHttpEndpoint;
};
