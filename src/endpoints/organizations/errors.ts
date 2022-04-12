import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class OrganizationExistsError extends OperationError {
  public name = 'OrganizationExistsError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Organization exists');
  }
}

export class OrganizationDoesNotExistError extends OperationError {
  public name = 'OrganizationDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Organization not found');
  }
}
