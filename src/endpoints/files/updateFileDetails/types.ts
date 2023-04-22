import {FileMatcher, PublicFile} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface UpdateFileDetailsInput {
  description?: string;
  mimetype?: string;
}

export interface UpdateFileDetailsEndpointParams extends FileMatcher {
  file: UpdateFileDetailsInput;
}

export interface UpdateFileDetailsEndpointResult {
  file: PublicFile;
}

export type UpdateFileDetailsEndpoint = Endpoint<
  BaseContextType,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult
>;
