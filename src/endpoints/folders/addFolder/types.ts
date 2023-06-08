import {PublicFolder} from '../../../definitions/folder';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

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
}

export type AddFolderEndpoint = Endpoint<
  BaseContextType,
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;
