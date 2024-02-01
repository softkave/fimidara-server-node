import {kUtilsInjectables} from './injection/injectables';
import {registerInjectables} from './injection/register';

export async function globalDispose() {
  kUtilsInjectables.disposables().disposeAll();
  await Promise.all([kUtilsInjectables.dbConnection().close()]);
  await kUtilsInjectables.promises().close().flush();
}

export async function globalSetup() {
  registerInjectables();
  await kUtilsInjectables.dbConnection().wait();
}
