import {isObject} from 'lodash-es';
import {PermissionItem} from '../../definitions/permissionItem.js';
import {kAppMessages} from '../../utils/messages.js';
import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';
import {ServerRecommendedActionsMap} from '../types.js';

export class EmailAddressNotAvailableError extends OperationError {
  name = 'EmailAddressNotAvailableError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Email address is not available'
    );
  }
}

export class InvalidCredentialsError extends OperationError {
  name = 'InvalidCredentialsError';
  action = ServerRecommendedActionsMap.LoginAgain;
  statusCode = kEndpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      kAppMessages.token.invalidCredentials
    );
  }
}

export class CredentialsExpiredError extends OperationError {
  name = 'CredentialsExpiredError';
  action = ServerRecommendedActionsMap.LoginAgain;
  statusCode = kEndpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Credentials expired');
  }
}

export class InvalidEmailOrPasswordError extends OperationError {
  name = 'InvalidEmailOrPasswordError';
  statusCode = kEndpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Invalid email or password'
    );
  }
}

export interface PermissionDeniedErrorParams extends OperationErrorParameters {
  item?: PermissionItem;
}

export class PermissionDeniedError extends OperationError {
  name = 'PermissionDeniedError';
  statusCode = kEndpointConstants.httpStatusCode.forbidden;
  item?: PermissionItem;

  constructor(props?: PermissionDeniedErrorParams | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission denied');
    if (isObject(props)) this.item = props.item;
  }
}

export class EmailAddressVerifiedError extends OperationError {
  name = 'EmailAddressVerifiedError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Email address already verified'
    );
  }
}

export class EmailAddressNotVerifiedError extends OperationError {
  name = 'EmailAddressNotVerifiedError';
  statusCode = kEndpointConstants.httpStatusCode.forbidden;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Only read-related actions are permitted for unverified email addresses. ' +
        'Please login and go to the Settings page to verify your email address'
    );
  }
}

export class IncorrectPasswordError extends OperationError {
  name = 'IncorrectPasswordError';
  statusCode = kEndpointConstants.httpStatusCode.unauthorized;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'The password you entered is incorrect'
    );
  }
}

export class ChangePasswordError extends OperationError {
  name = 'ChangePasswordError';
  statusCode = kEndpointConstants.httpStatusCode.unauthorized;
  action = ServerRecommendedActionsMap.RequestChangePassword;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      kAppMessages.user.changePassword()
    );
  }
}
