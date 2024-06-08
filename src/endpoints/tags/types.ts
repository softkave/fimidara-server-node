import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddTagEndpoint} from './addTag/types.js';
import {CountWorkspaceTagsEndpoint} from './countWorkspaceTags/types.js';
import {DeleteTagEndpoint} from './deleteTag/types.js';
import {GetTagEndpoint} from './getTag/types.js';
import {GetWorkspaceTagsEndpoint} from './getWorkspaceTags/types.js';
import {UpdateTagEndpoint} from './updateTag/types.js';

export type AddTagHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<AddTagEndpoint>;
export type DeleteTagHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<DeleteTagEndpoint>;
export type GetWorkspaceTagsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspaceTagsEndpoint>;
export type CountWorkspaceTagsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspaceTagsEndpoint>;
export type GetTagHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<GetTagEndpoint>;
export type UpdateTagHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<UpdateTagEndpoint>;

export type TagsExportedEndpoints = {
  addTag: AddTagHttpEndpoint;
  deleteTag: DeleteTagHttpEndpoint;
  getWorkspaceTags: GetWorkspaceTagsHttpEndpoint;
  countWorkspaceTags: CountWorkspaceTagsHttpEndpoint;
  getTag: GetTagHttpEndpoint;
  updateTag: UpdateTagHttpEndpoint;
};
