import {PublicFolder} from '../../../definitions/folder';
import {BaseContext} from '../../contexts/types';
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
  BaseContext,
  AddFolderEndpointParams,
  AddFolderEndpointResult
>;
