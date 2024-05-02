import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';

export class UsageLimitExceededError extends OperationError {
  name = 'UsageLimitExceededError';
  statusCode = kEndpointConstants.httpStatusCode.forbidden;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Usage limit exceeded');
  }
}
