import {add} from 'date-fns';
import {kIkxUtils} from '../../../contexts/ijx/injectables.js';
import {kFileConstants} from '../constants.js';

export function getNextMultipartTimeout() {
  return add(new Date(), {
    seconds:
      kIkxUtils.suppliedConfig().multipartLockTimeoutSeconds ??
      kFileConstants.multipartLockTimeoutSeconds,
  }).getTime();
}
