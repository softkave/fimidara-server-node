import {FileMatcher} from '../../../definitions/file.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export type DeleteFileEndpointParams = FileMatcher;
export type DeleteFileEndpoint = Endpoint<DeleteFileEndpointParams, LongRunningJobResult>;
