import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddFileBackendConfigEndpoint} from './addConfig/types.js';
import {AddFileBackendMountEndpoint} from './addMount/types.js';
import {CountFileBackendConfigsEndpoint} from './countConfigs/types.js';
import {CountFileBackendMountsEndpoint} from './countMounts/types.js';
import {DeleteFileBackendConfigEndpoint} from './deleteConfig/types.js';
import {DeleteFileBackendMountEndpoint} from './deleteMount/types.js';
import {GetFileBackendConfigEndpoint} from './getConfig/types.js';
import {GetFileBackendConfigsEndpoint} from './getConfigs/types.js';
import {GetFileBackendMountEndpoint} from './getMount/types.js';
import {GetFileBackendMountsEndpoint} from './getMounts/types.js';
import {ResolveFileBackendMountsEndpoint} from './resolveMounts/types.js';
import {UpdateFileBackendConfigEndpoint} from './updateConfig/types.js';
import {UpdateFileBackendMountEndpoint} from './updateMount/types.js';

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
