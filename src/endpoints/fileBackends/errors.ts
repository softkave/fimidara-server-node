import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';

export class MountSourceMissingBucketError extends OperationError {
  name = 'MountSourceMissingBucketError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Mount is missing bucket');
  }
}
