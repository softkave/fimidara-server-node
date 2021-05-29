import OperationError from '../../utilities/OperationError';

export class AuthKeyExistsError extends OperationError {
    public name = 'AuthKeyExistsError';
    public message = 'Authorization key exists';
}

export class AuthKeyDoesNotExistError extends OperationError {
    public name = 'AuthKeyDoesNotExistError';
    public message = 'Authorization key does not exist';
}
