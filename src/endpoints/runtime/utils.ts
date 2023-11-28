import {kReuseableErrors} from '../../utils/reusableErrors';

export function throwAppRuntimeStateFound() {
  throw kReuseableErrors.appRuntimeState.notFound();
}
