import OperationError from './OperationError';

export class ServerError extends OperationError {
    public name = 'ServerError';
    public message = 'Server error';
}

export class ValidationError extends OperationError {
    public name = 'ValidationError';
}
