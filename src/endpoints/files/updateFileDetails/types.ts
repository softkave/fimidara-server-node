import {IFileMatcher, IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateFileDetailsInput {
  description?: string;
  mimetype?: string;
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
