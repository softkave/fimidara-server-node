import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class ProgramAccessTokenExistsError extends OperationError {
  name = 'ProgramAccessTokenExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Program access token exists'
    );
  }
}

export class ProgramAccessTokenDoesNotExistError extends OperationError {
  name = 'ProgramAccessTokenDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Program access token not found'
    );
  }
}
