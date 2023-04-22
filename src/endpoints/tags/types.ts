import {LongRunningJobResult} from '../jobs/types';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {AddTagEndpoint, AddTagEndpointParams, AddTagEndpointResult} from './addTag/types';
import {DeleteTagEndpoint, DeleteTagEndpointParams} from './deleteTag/types';
import {GetTagEndpoint, GetTagEndpointParams, GetTagEndpointResult} from './getTag/types';
import {
  GetWorkspaceTagsEndpoint,
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult,
} from './getWorkspaceTags/types';
import {
  UpdateTagEndpoint,
  UpdateTagEndpointParams,
  UpdateTagEndpointResult,
} from './updateTag/types';

export type AddTagHttpEndpoint = HttpEndpoint<
  AddTagEndpoint,
  AddTagEndpointParams,
  AddTagEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type DeleteTagHttpEndpoint = HttpEndpoint<
  DeleteTagEndpoint,
  DeleteTagEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetWorkspaceTagsHttpEndpoint = HttpEndpoint<
  GetWorkspaceTagsEndpoint,
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetTagHttpEndpoint = HttpEndpoint<
  GetTagEndpoint,
  GetTagEndpointParams,
  GetTagEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateTagHttpEndpoint = HttpEndpoint<
  UpdateTagEndpoint,
  UpdateTagEndpointParams,
  UpdateTagEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type TagsExportedEndpoints = {
  addTag: ExportedHttpEndpointWithMddocDefinition<AddTagHttpEndpoint>;
  deleteTag: ExportedHttpEndpointWithMddocDefinition<DeleteTagHttpEndpoint>;
  getWorkspaceTags: ExportedHttpEndpointWithMddocDefinition<GetWorkspaceTagsHttpEndpoint>;
  getTag: ExportedHttpEndpointWithMddocDefinition<GetTagHttpEndpoint>;
  updateTag: ExportedHttpEndpointWithMddocDefinition<UpdateTagHttpEndpoint>;
};
