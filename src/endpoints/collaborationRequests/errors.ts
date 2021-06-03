import OperationError from '../../utilities/OperationError';

export class TransformerExistsError extends OperationError {
    public name = 'TransformerExistsError';
    public message = 'Transformer exists';
}

export class TransformerDoesNotExistError extends OperationError {
    public name = 'TransformerDoesNotExistError';
    public message = 'Transformer does not exist';
}
