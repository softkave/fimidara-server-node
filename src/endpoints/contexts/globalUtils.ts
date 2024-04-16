import {FimidaraSuppliedConfig} from '../../resources/config';
import {kUtilsInjectables} from './injection/injectables';
import {registerInjectables} from './injection/register';

export async function globalDispose() {
  await kUtilsInjectables.disposables().awaitDisposeAll();
  await kUtilsInjectables.promises().close().flush();
  await kUtilsInjectables.dbConnection().close();
}

export async function globalSetup(overrideConfig: FimidaraSuppliedConfig = {}) {
  registerInjectables(overrideConfig);
  await kUtilsInjectables.dbConnection().wait();

  if (overrideConfig.startApp) {
    await kUtilsInjectables.serverApp().startApp();

    if (overrideConfig.startPool) {
      await kUtilsInjectables.workerPool().startPool();
    }
  }
}
