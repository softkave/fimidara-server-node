import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFile} from '../types';

// TODO: should we able to move files accross buckets and environments
export interface IUpdateFileDetailsInput {
  // TODO: allow moving of files accross directories
  name?: string;
  description?: string;
  mimetype?: string;
}

export interface IUpdateFileDetailsEndpointParams {
  fileId: string;
  data: IUpdateFileDetailsInput;
}

export interface IUpdateFileDetailsEndpointResult {
  file: IPublicFile;
}

export type UpdateFileDetailsEndpoint = Endpoint<
  IBaseContext,
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsEndpointResult
>;
