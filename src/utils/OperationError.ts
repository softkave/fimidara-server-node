import {isObject, isString} from 'lodash-es';
import {EndpointResultNote} from '../endpoints/types.js';

export interface OperationErrorParameters {
  message?: string;
  field?: string;
  action?: string;
  value?: unknown;
}

export default class OperationError extends Error {
  message = 'An error occurred';
  field?: string;
  // recommended action for the client
  action?: string;
  value?: string;
  statusCode?: number;
  isPublicError = true;
  notes?: EndpointResultNote[];

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

export type FimidaraExternalError = Pick<
  OperationError,
  'name' | 'message' | 'action' | 'field' | 'notes'
>;

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

export function isOperationError(error: unknown): error is OperationError {
  return isString((error as Error | undefined)?.message);
}
