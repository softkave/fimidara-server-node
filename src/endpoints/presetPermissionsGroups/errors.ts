import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class PresetPermissionsGroupExistsError extends OperationError {
  public name = 'PresetPermissionsGroupExistsError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Preset permissions groups exists'
    );
  }
}

export class PresetPermissionsGroupDoesNotExistError extends OperationError {
  public name = 'PresetPermissionsGroupDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Preset permissions group not found'
    );
  }
}
