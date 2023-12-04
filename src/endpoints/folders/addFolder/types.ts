import {PublicFolder} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
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
  BaseContextType,
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;
