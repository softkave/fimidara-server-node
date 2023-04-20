import {ExportedHttpEndpoint} from '../types';
import {AddTagEndpoint} from './addTag/types';
import {DeleteTagEndpoint} from './deleteTag/types';
import {GetTagEndpoint} from './getTag/types';
import {GetWorkspaceTagEndpoint} from './getWorkspaceTags/types';
import {UpdateTagEndpoint} from './updateTag/types';

export type TagsExportedEndpoints = {
  addTag: ExportedHttpEndpoint<AddTagEndpoint>;
  deleteTag: ExportedHttpEndpoint<DeleteTagEndpoint>;
  getWorkspaceTags: ExportedHttpEndpoint<GetWorkspaceTagEndpoint>;
  getTag: ExportedHttpEndpoint<GetTagEndpoint>;
  updateTag: ExportedHttpEndpoint<UpdateTagEndpoint>;
};
