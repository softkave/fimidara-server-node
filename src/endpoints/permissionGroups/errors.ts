import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class PermissionGroupExistsError extends OperationError {
  public name = 'PermissionGroupExistsError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'PermissionGroup permissions groups exists'
    );
  }
}

export class PermissionGroupDoesNotExistError extends OperationError {
  public name = 'PermissionGroupDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'PermissionGroup permissions group not found'
    );
  }
}
