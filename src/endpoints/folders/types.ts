import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddFolderEndpoint} from './addFolder/types.js';
import {CountFolderContentEndpoint} from './countFolderContent/types.js';
import {DeleteFolderEndpoint} from './deleteFolder/types.js';
import {GetFolderEndpoint} from './getFolder/types.js';
import {ListFolderContentEndpoint} from './listFolderContent/types.js';
import {UpdateFolderEndpoint} from './updateFolder/types.js';

export type AddFolderHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddFolderEndpoint>;
export type DeleteFolderHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteFolderEndpoint>;
export type GetFolderHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFolderEndpoint>;
export type ListFolderContentHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ListFolderContentEndpoint>;
export type CountFolderContentHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountFolderContentEndpoint>;
export type UpdateFolderHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateFolderEndpoint>;

export type FoldersExportedEndpoints = {
  addFolder: AddFolderHttpEndpoint;
  deleteFolder: DeleteFolderHttpEndpoint;
  getFolder: GetFolderHttpEndpoint;
  listFolderContent: ListFolderContentHttpEndpoint;
  countFolderContent: CountFolderContentHttpEndpoint;
  updateFolder: UpdateFolderHttpEndpoint;
};
