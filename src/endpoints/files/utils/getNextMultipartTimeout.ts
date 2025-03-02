import {add} from 'date-fns';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFileConstants} from '../constants.js';

export function getNextMultipartTimeout() {
  return add(new Date(), {
    seconds:
      kIjxUtils.suppliedConfig().multipartLockTimeoutSeconds ??
      kFileConstants.multipartLockTimeoutSeconds,
  }).getTime();
}
