import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class AgentTokenExistsError extends OperationError {
  name = 'AgentTokenExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Agent token exists.');
  }
}

export class AgentTokenDoesNotExistError extends OperationError {
  name = 'AgentTokenDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Agent token not found.');
  }
}
