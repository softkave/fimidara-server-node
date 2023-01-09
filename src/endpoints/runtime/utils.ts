import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {errorMessages} from '../messages';

export function throwAppRuntimeStateFound() {
  appAssert(false, new ServerError(), errorMessages.appRuntimeStateNotFound);
}
