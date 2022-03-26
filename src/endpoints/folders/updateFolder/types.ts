import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {IPublicAccessOpInput} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateFolderInput {
  description?: string;
  maxFileSizeInBytes?: number;
  publicAccessOps?: IPublicAccessOpInput[];
  removePublicAccessOps?: boolean;
}

export interface IUpdateFolderParams extends IFolderMatcher {
  folder: IUpdateFolderInput;
}

export interface IUpdateFolderResult {
  folder: IPublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  IBaseContext,
  IUpdateFolderParams,
  IUpdateFolderResult
>;
