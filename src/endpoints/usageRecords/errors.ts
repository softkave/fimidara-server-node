import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class UsageLimitExceededError extends OperationError {
  name = 'UsageLimitExceededError';
  statusCode = endpointConstants.httpStatusCode.forbidden;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Usage limit exceeded');
  }
}
