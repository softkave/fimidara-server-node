import OperationError from '../../utilities/OperationError';
import {ServerRecommendedActions} from '../types';

export class EmailAddressNotAvailableError extends OperationError {
    public name = 'EmailAddressNotAvailableError';
    public message = 'Email address is not available';
}

export class InvalidCredentialsError extends OperationError {
    public name = 'InvalidCredentialsError';
    public message = 'Invalid credentials';
    public action = ServerRecommendedActions.LoginAgain;
}

export class CredentialsExpiredError extends OperationError {
    public name = 'CredentialsExpiredError';
    public message = 'Credentials expired';
    public action = ServerRecommendedActions.LoginAgain;
}

export class InvalidEmailAddressError extends OperationError {
    public name = 'InvalidEmailAddressError';
    public message = 'Email address is invalid';
}

export class InvalidEmailOrPasswordError extends OperationError {
    public name = 'InvalidEmailOrPasswordError';
    public message = 'Invalid email or password';
}

export class LoginAgainError extends OperationError {
    public name = 'LoginAgainError';
    public message = 'Please login again';
    public action = ServerRecommendedActions.LoginAgain;
}

export class UserDoesNotExistError extends OperationError {
    public name = 'UserDoesNotExistError';
    public message = 'User does not exist';
    public action = ServerRecommendedActions.Logout;
}

export class PermissionDeniedError extends OperationError {
    public name = 'PermissionDeniedError';
    public message = 'Permission denied';
}

export class EmailAddressVerifiedError extends OperationError {
    public name = 'EmailAddressVerifiedError';
    public message = 'Email address already verified';
}

export class VerificationFailedError extends OperationError {
    public name = 'VerificationFailedError';
    public message = 'Verification failed'; // TODO: can we make this better?
}

export class IncorrectPasswordError extends OperationError {
    public name = 'IncorrectPasswordError';
    public message = 'The password you entered is incorrect';
}
