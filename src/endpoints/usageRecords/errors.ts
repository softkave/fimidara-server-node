import OperationError, {
  IOperationErrorParameters,
  getErrorMessageFromParams,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class UsageLimitExceeded extends OperationError {
  public name = 'UsageLimitExceeded';
  public statusCode = endpointConstants.httpStatusCode.forbidden;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Usage limit exceeded');
  }
}
