import {isObject, isString} from 'lodash';

export interface IOperationErrorParameters {
  message?: string;
  field?: string;
  action?: string;
  value?: any;
}

export default class OperationError extends Error {
  public message = 'Error';
  public field?: string;

  // recommended action for the client
  public action?: string;
  public value?: string;
  public isPublic = true;

  constructor(props?: IOperationErrorParameters | string) {
    super();

    if (isObject(props)) {
      this.field = props.field;
      this.action = props.action;

      if (props.value) {
        this.value = JSON.stringify(props.value);
      }

      if (props.message) {
        this.message = props.message;
      }
    } else if (props) {
      this.message = props;
    }
  }
}

export function getErrorMessageFromParams(
  props?: IOperationErrorParameters | string,
  defaultMessage = ''
) {
  if (isString(props)) {
    return props;
  } else if (props?.message) {
    return props.message;
  }

  return defaultMessage;
}

export function isOperationError(error: any): error is OperationError {
  return !!error?.message;
}
