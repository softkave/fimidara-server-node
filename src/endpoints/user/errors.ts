import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';
import {ServerRecommendedActions} from '../types';

export class EmailAddressNotAvailableError extends OperationError {
  public name = 'EmailAddressNotAvailableError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Email address is not available'
    );
  }
}

export class InvalidCredentialsError extends OperationError {
  public name = 'InvalidCredentialsError';
  public action = ServerRecommendedActions.LoginAgain;
  public statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid credentials');
  }
}

export class CredentialsExpiredError extends OperationError {
  public name = 'CredentialsExpiredError';
  public action = ServerRecommendedActions.LoginAgain;
  public statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Credentials expired');
  }
}

export class InvalidEmailOrPasswordError extends OperationError {
  public name = 'InvalidEmailOrPasswordError';
  public statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Invalid email or password'
    );
  }
}

export class PermissionDeniedError extends OperationError {
  public name = 'PermissionDeniedError';
  public statusCode = endpointConstants.httpStatusCode.forbidden;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission denied');
  }
}

export class EmailAddressVerifiedError extends OperationError {
  public name = 'EmailAddressVerifiedError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Email address already verified'
    );
  }
}

export class IncorrectPasswordError extends OperationError {
  public name = 'IncorrectPasswordError';
  public statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'The password you entered is incorrect'
    );
  }
}
