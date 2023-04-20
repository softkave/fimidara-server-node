import {AppActionType, AppResourceType} from '../../definitions/system';
import {ExportedHttpEndpoint} from '../types';
import {AddFolderEndpoint} from './addFolder/types';
import {DeleteFolderEndpoint} from './deleteFolder/types';
import {GetFolderEndpoint} from './getFolder/types';
import {ListFolderContentEndpoint} from './listFolderContent/types';
import {UpdateFolderEndpoint} from './updateFolder/types';

export interface FolderPublicAccessOpInput {
  action: AppActionType;
  resourceType: AppResourceType;
  appliesToFolder?: boolean;
}

export type FoldersExportedEndpoints = {
  addFolder: ExportedHttpEndpoint<AddFolderEndpoint>;
  deleteFolder: ExportedHttpEndpoint<DeleteFolderEndpoint>;
  getFolder: ExportedHttpEndpoint<GetFolderEndpoint>;
  listFolderContent: ExportedHttpEndpoint<ListFolderContentEndpoint>;
  updateFolder: ExportedHttpEndpoint<UpdateFolderEndpoint>;
};
