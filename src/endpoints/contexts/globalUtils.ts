import {FimidaraSuppliedConfig} from '../../resources/config';
import {kUtilsInjectables} from './injection/injectables';
import {registerInjectables} from './injection/register';

export async function globalDispose() {
  kUtilsInjectables.disposables().disposeAll();
  await Promise.allSettled([kUtilsInjectables.dbConnection().close()]);
  await kUtilsInjectables.promises().close().flush();
}

export async function globalSetup(overrideConfig: FimidaraSuppliedConfig = {}) {
  registerInjectables(overrideConfig);
  await kUtilsInjectables.dbConnection().wait();
}
