import {PublicFolder} from '../../../definitions/folder';
import {Endpoint, EndpointResultNote} from '../../types';

export interface NewFolderInput {
  // folder path should include the workspace rootname
  folderpath: string;
  description?: string;
}

export interface AddFolderEndpointParams {
  folder: NewFolderInput;
}

export interface AddFolderEndpointResult {
  folder: PublicFolder;
  notes?: EndpointResultNote[];
}

export type AddFolderEndpoint = Endpoint<
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;
