import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddTagEndpoint} from './addTag/types';
import {CountWorkspaceTagsEndpoint} from './countWorkspaceTags/types';
import {DeleteTagEndpoint} from './deleteTag/types';
import {GetTagEndpoint} from './getTag/types';
import {GetWorkspaceTagsEndpoint} from './getWorkspaceTags/types';
import {UpdateTagEndpoint} from './updateTag/types';

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
