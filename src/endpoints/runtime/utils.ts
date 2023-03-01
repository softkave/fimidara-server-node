import {reuseableErrors} from '../../utils/reusableErrors';

export function throwAppRuntimeStateFound() {
  throw reuseableErrors.appRuntimeState.notFound();
}
