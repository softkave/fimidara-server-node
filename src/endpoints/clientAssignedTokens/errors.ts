import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class ClientAssignedTokenExistsError extends OperationError {
  public name = 'ClientAssignedTokenExistsError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Client assigned token exists'
    );
  }
}

export class ClientAssignedTokenDoesNotExistError extends OperationError {
  public name = 'ClientAssignedTokenDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Client assigned token not found'
    );
  }
}
