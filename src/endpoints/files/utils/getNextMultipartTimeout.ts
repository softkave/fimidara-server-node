import {add} from 'date-fns';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {kFileConstants} from '../constants.js';

export function getNextMultipartTimeout() {
  return add(new Date(), {
    seconds:
      kUtilsInjectables.suppliedConfig().multipartLockTimeoutSeconds ??
      kFileConstants.multipartLockTimeoutSeconds,
  }).getTime();
}
