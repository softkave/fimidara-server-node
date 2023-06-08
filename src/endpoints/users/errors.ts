import {appMessages} from '../../utils/messages';
import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';
import {ServerRecommendedActions} from '../types';

export class EmailAddressNotAvailableError extends OperationError {
  name = 'EmailAddressNotAvailableError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Email address is not available.');
  }
}

export class InvalidCredentialsError extends OperationError {
  name = 'InvalidCredentialsError';
  action = ServerRecommendedActions.LoginAgain;
  statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, appMessages.token.invalidCredentials);
  }
}

export class CredentialsExpiredError extends OperationError {
  name = 'CredentialsExpiredError';
  action = ServerRecommendedActions.LoginAgain;
  statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Credentials expired.');
  }
}

export class InvalidEmailOrPasswordError extends OperationError {
  name = 'InvalidEmailOrPasswordError';
  statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid email or password.');
  }
}

export class PermissionDeniedError extends OperationError {
  name = 'PermissionDeniedError';
  statusCode = endpointConstants.httpStatusCode.forbidden;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission denied.');
  }
}

export class EmailAddressVerifiedError extends OperationError {
  name = 'EmailAddressVerifiedError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Email address already verified.');
  }
}

export class EmailAddressNotVerifiedError extends OperationError {
  name = 'EmailAddressNotVerifiedError';
  statusCode = endpointConstants.httpStatusCode.forbidden;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Only read-related actions are permitted for unverified email addresses. ' +
        'Please login and go to the Settings page to verify your email address.'
    );
  }
}

export class IncorrectPasswordError extends OperationError {
  name = 'IncorrectPasswordError';
  statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'The password you entered is incorrect.');
  }
}

export class ChangePasswordError extends OperationError {
  name = 'ChangePasswordError';
  statusCode = endpointConstants.httpStatusCode.unauthorized;
  action = ServerRecommendedActions.RequestChangePassword;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, appMessages.user.changePassword());
  }
}

export class UserOnWaitlistError extends OperationError {
  name = 'UserOnWaitlistError';
  statusCode = endpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, appMessages.user.userIsOnWaitlist());
  }
}
