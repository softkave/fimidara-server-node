import {IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateFileDetailsInput {
  // name?: string;
  description?: string;
  mimetype?: string;
}

export interface IUpdateFileDetailsEndpointParams {
  organizationId?: string;
  path: string;
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
