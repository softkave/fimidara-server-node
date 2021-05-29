import OperationError from '../utilities/OperationError';

export class InvalidRequestError extends OperationError {
    public name = 'InvalidRequestError';
    public message = 'Request is invalid';
}

// TODO: can we make this better?
export class RateLimitError extends OperationError {
    public name = 'RateLimitError';
    public message = 'Rate limit in progress, please try again';
}
