import {AppActionType, AppResourceType} from '../../definitions/system';
import {LongRunningJobResult} from '../jobs/types';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  AddFolderEndpoint,
  AddFolderEndpointParams,
  AddFolderEndpointResult,
} from './addFolder/types';
import {
  CountFolderContentEndpoint,
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
} from './countFolderContent/types';
import {DeleteFolderEndpoint, DeleteFolderEndpointParams} from './deleteFolder/types';
import {
  GetFolderEndpoint,
  GetFolderEndpointParams,
  GetFolderEndpointResult,
} from './getFolder/types';
import {
  ListFolderContentEndpoint,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult,
} from './listFolderContent/types';
import {
  UpdateFolderEndpoint,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
} from './updateFolder/types';

export interface FolderPublicAccessOpInput {
  action: AppActionType;
  resourceType: AppResourceType;
  appliesToFolder?: boolean;
}

export type AddFolderHttpEndpoint = HttpEndpoint<
  AddFolderEndpoint,
  AddFolderEndpointParams,
  AddFolderEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type DeleteFolderHttpEndpoint = HttpEndpoint<
  DeleteFolderEndpoint,
  DeleteFolderEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetFolderHttpEndpoint = HttpEndpoint<
  GetFolderEndpoint,
  GetFolderEndpointParams,
  GetFolderEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type ListFolderContentHttpEndpoint = HttpEndpoint<
  ListFolderContentEndpoint,
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type CountFolderContentHttpEndpoint = HttpEndpoint<
  CountFolderContentEndpoint,
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateFolderHttpEndpoint = HttpEndpoint<
  UpdateFolderEndpoint,
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type FoldersExportedEndpoints = {
  addFolder: ExportedHttpEndpointWithMddocDefinition<AddFolderHttpEndpoint>;
  deleteFolder: ExportedHttpEndpointWithMddocDefinition<DeleteFolderHttpEndpoint>;
  getFolder: ExportedHttpEndpointWithMddocDefinition<GetFolderHttpEndpoint>;
  listFolderContent: ExportedHttpEndpointWithMddocDefinition<ListFolderContentHttpEndpoint>;
  countFolderContent: ExportedHttpEndpointWithMddocDefinition<CountFolderContentHttpEndpoint>;
  updateFolder: ExportedHttpEndpointWithMddocDefinition<UpdateFolderHttpEndpoint>;
};
