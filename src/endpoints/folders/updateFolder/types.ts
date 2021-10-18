import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewFolderInput} from '../addFolder/types';
import {IPublicFolder} from '../types';

export type IUpdateFolderInput = Partial<INewFolderInput>;

export interface IUpdateFolderParams {
  folderId: string;
  data: IUpdateFolderInput;
}

export interface IUpdateFolderResult {
  folder: IPublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  IBaseContext,
  IUpdateFolderParams,
  IUpdateFolderResult
>;
