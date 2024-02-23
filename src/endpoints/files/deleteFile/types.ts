import {FileMatcher} from '../../../definitions/file';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeleteFileEndpointParams = FileMatcher;
export type DeleteFileEndpoint = Endpoint<DeleteFileEndpointParams, LongRunningJobResult>;
