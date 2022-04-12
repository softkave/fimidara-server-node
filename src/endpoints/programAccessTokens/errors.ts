import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class ProgramAccessTokenExistsError extends OperationError {
  public name = 'ProgramAccessTokenExistsError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Program access token exists'
    );
  }
}

export class ProgramAccessTokenDoesNotExistError extends OperationError {
  public name = 'ProgramAccessTokenDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Program access token not found'
    );
  }
}
