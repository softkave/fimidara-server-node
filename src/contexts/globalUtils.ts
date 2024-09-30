import {FimidaraSuppliedConfig} from '../resources/config.js';
import {kUtilsInjectables} from './injection/injectables.js';
import {registerInjectables} from './injection/register.js';

export async function globalDispose() {
  await kUtilsInjectables.disposables().awaitDisposeAll();
  await kUtilsInjectables.promises().close().flush();
  await kUtilsInjectables.dbConnection().close();
}

export async function globalSetup(overrideConfig: FimidaraSuppliedConfig = {}) {
  await registerInjectables(overrideConfig);
  await kUtilsInjectables.dbConnection().wait();

  const suppliedConfig = kUtilsInjectables.suppliedConfig();

  if (suppliedConfig.useFimidaraApp) {
    kUtilsInjectables.logger().log('Starting server app');
    await kUtilsInjectables.serverApp().startApp();
    kUtilsInjectables.logger().log('Started server app');

    if (suppliedConfig.useFimidaraWorkerPool) {
      kUtilsInjectables.logger().log('Starting worker pool');
      await kUtilsInjectables.workerPool().startPool();
      kUtilsInjectables.logger().log('Started worker pool');
    }
  }
}
