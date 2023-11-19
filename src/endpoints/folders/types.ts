import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddFolderEndpoint} from './addFolder/types';
import {CountFolderContentEndpoint} from './countFolderContent/types';
import {DeleteFolderEndpoint} from './deleteFolder/types';
import {GetFolderEndpoint} from './getFolder/types';
import {ListFolderContentEndpoint} from './listFolderContent/types';
import {UpdateFolderEndpoint} from './updateFolder/types';

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
