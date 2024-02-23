import * as Joi from 'joi';
import {ValidationError} from './errors';
import OperationError from './OperationError';

export function validate<DataType>(
  data: DataType,
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): NonNullable<DataType> {
  const {error, value} = schema.validate(data, {
    abortEarly: false,
    convert: true,
    ...options,
  });

  if (error) {
    const errorArray = error.details.map(err => {
      return new ValidationError({
        field: err.path.join('.'),
        message: err.message,
      });
    });

    throw errorArray;
  }

  return value;
}

export function validateReturnErrors(
  data: any,
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): OperationError[] | undefined {
  const {error} = schema.validate(data, {
    abortEarly: false,
    convert: true,
    ...options,
  });

  if (error) {
    const errorArray = error.details.map(err => {
      return new ValidationError({
        field: err.path.join('.'),
        message: err.message,
      });
    });

    return errorArray;
  }

  return undefined;
}
