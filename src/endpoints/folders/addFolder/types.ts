import {IPublicFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewFolderInput {
  // folder path should include the workspace rootname
  folderpath: string;
  description?: string;
}

export interface IAddFolderEndpointParams {
  folder: INewFolderInput;
}

export interface IAddFolderEndpointResult {
  folder: IPublicFolder;
}

export type AddFolderEndpoint = Endpoint<
  IBaseContext,
  IAddFolderEndpointParams,
  IAddFolderEndpointResult
>;
