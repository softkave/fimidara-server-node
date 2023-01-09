import {IFileMatcher, IPublicFile} from '../../../definitions/file';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {UploadFilePublicAccessActions} from '../uploadFile/types';

export interface IUpdateFileDetailsInput {
  description?: string;
  mimetype?: string;
  publicAccessAction?: UploadFilePublicAccessActions;
  tags?: IAssignedTagInput[];
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
