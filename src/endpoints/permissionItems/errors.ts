import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class PermissionItemExistsError extends OperationError {
  public name = 'PermissionItemExistsError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission item exists');
  }
}

export class PermissionItemDoesNotExistError extends OperationError {
  public name = 'PermissionItemDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Permission item not found'
    );
  }
}
