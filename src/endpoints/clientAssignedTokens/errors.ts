import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class ClientAssignedTokenExistsError extends OperationError {
  name = 'ClientAssignedTokenExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Client assigned token exists'
    );
  }
}

export class ClientAssignedTokenDoesNotExistError extends OperationError {
  name = 'ClientAssignedTokenDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Client assigned token not found'
    );
  }
}
