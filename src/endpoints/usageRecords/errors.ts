import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {kEndpointConstants} from '../constants';

export class UsageLimitExceededError extends OperationError {
  name = 'UsageLimitExceededError';
  statusCode = kEndpointConstants.httpStatusCode.forbidden;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Usage limit exceeded');
  }
}
