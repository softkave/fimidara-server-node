import {copyFileOrFolder} from './copyFileOrFolder.js';
import {IFimidaraSyncOpts} from './types.js';

export async function fimidaraSync(opts: IFimidaraSyncOpts) {
  await copyFileOrFolder(opts);
}
