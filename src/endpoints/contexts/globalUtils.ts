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
  kUtilsInjectables.logger().log(overrideConfig);
  await kUtilsInjectables.dbConnection().wait();

  if (overrideConfig.startApp) {
    kUtilsInjectables.logger().log('Starting server app');
    await kUtilsInjectables.serverApp().startApp();
    kUtilsInjectables.logger().log('Started server app');

    if (overrideConfig.startPool) {
      kUtilsInjectables.logger().log('Starting worker pool');
      await kUtilsInjectables.workerPool().startPool();
      kUtilsInjectables.logger().log('Started worker pool');
    }
  }
}
