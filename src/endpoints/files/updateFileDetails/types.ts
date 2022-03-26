import {IFileMatcher, IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {UploadFilePublicAccessActions} from '../uploadFile/types';

export interface IUpdateFileDetailsInput {
  // name?: string;
  description?: string;
  mimetype?: string;
  publicAccessActions?: UploadFilePublicAccessActions;
}

export interface IUpdateFileDetailsEndpointParams extends IFileMatcher {
  file: IUpdateFileDetailsInput;
}

export interface IUpdateFileDetailsEndpointResult {
  file: IPublicFile;
}

export type UpdateFileDetailsEndpoint = Endpoint<
  IBaseContext,
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsEndpointResult
>;
