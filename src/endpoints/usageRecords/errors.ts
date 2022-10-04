import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class UsageLimitExceededError extends OperationError {
  name = 'UsageLimitExceededError';
  statusCode = endpointConstants.httpStatusCode.forbidden;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Usage limit exceeded');
  }
}
