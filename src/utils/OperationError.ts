import {isObject, isString} from 'lodash';

export interface OperationErrorParameters {
  message?: string;
  field?: string;
  action?: string;
  value?: any;
}

export type EndpointExportedError = {
  name: string;
  message: string;
  field?: string;
  action?: string;
};

export default class OperationError extends Error {
  message = 'An error occurred.';
  field?: string;

  // recommended action for the client
  action?: string;
  value?: string;
  statusCode?: number;
  isPublicError = true;

  constructor(props?: OperationErrorParameters | string) {
    super();

    if (isObject(props)) {
      this.field = props.field;
      this.action = props.action;

      if (props.value) this.value = JSON.stringify(props.value);
      if (props.message) this.message = props.message;
    } else if (props) {
      this.message = props;
    }
  }
}

export function getErrorMessageFromParams(
  props?: OperationErrorParameters | string,
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
