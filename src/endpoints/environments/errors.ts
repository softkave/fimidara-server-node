import OperationError from '../../utilities/OperationError';

export class EnvironmentExistsError extends OperationError {
    public name = 'EnvironmentExistsError';
    public message = 'Environment exists';
}

export class EnvironmentDoesNotExistError extends OperationError {
    public name = 'EnvironmentDoesNotExistError';
    public message = 'Environment does not exist';
}
