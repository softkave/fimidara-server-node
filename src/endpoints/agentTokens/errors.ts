import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class AgentTokenExistsError extends OperationError {
  name = 'AgentTokenExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Program access token exists');
  }
}

export class AgentTokenDoesNotExistError extends OperationError {
  name = 'AgentTokenDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Program access token not found');
  }
}
