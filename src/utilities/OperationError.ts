import {isObject, isString} from 'lodash';

export interface IOperationErrorParameters {
  message?: string;
  field?: string;
  action?: string;
  value?: any;
}

class OperationError extends Error {
  public message = 'Error';
  public field?: string;
  public action?: string;
  public value?: string;
  public isPublic = true;

  constructor(props?: IOperationErrorParameters | string) {
    super(isString(props) ? props : props?.message);

    if (isObject(props)) {
      // error data path
      this.field = props.field;

      // recommended action for the client
      this.action = props.action;

      if (props.value) {
        this.value = JSON.stringify(props.value);
      }
    }
  }
}

export default OperationError;
