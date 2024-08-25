import assert from 'assert';
import {FimidaraEndpoints} from '../index.js';
import {IFimidaraCmdOpts} from './types.js';

export function getFimidara(opts: IFimidaraCmdOpts) {
  assert(opts.authToken, 'authToken not provided');
  return new FimidaraEndpoints({
    authToken: opts.authToken,
    serverURL: opts.serverURL,
  });
}
