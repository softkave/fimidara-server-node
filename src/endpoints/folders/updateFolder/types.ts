import {IFolderMatcher, IPublicFolder} from '../../../definitions/folder';
import {IPublicAccessOpInput} from '../../../definitions/system';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateFolderInput {
  description?: string;
  publicAccessOps?: IPublicAccessOpInput[];
  removePublicAccessOps?: boolean;
  tags?: IAssignedTagInput[];
}

export interface IUpdateFolderEndpointParams extends IFolderMatcher {
  folder: IUpdateFolderInput;
}

export interface IUpdateFolderEndpointResult {
  folder: IPublicFolder;
}

export type UpdateFolderEndpoint = Endpoint<
  IBaseContext,
  IUpdateFolderEndpointParams,
  IUpdateFolderEndpointResult
>;
