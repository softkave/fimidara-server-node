import assert from 'assert';
import {FimidaraEndpoints} from '../index.js';
import {IFimidaraCmdOpts} from './types.js';

export function getFimidara(opts: Pick<IFimidaraCmdOpts, 'authToken'>) {
  assert(opts.authToken, 'authToken not provided');
  return new FimidaraEndpoints({authToken: opts.authToken});
}
