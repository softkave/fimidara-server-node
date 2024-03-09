import 'zx/globals';
import {getSuppliedConfig} from '../../resources/config';

async function getPIDFromPort(port: string | number): Promise<string> {
  const lsofResult = await $`sudo lsof -n -i :5000`;
  return '';
}

async function stopProcessWithPID(pid: string | number) {
  'kill -s SIGINT 12404';
}

async function stopAppWithPort(port: string | number) {
  const pid = await getPIDFromPort(port);
  await stopProcessWithPID(pid);
}

export async function stopApp() {
  const config = getSuppliedConfig();
  await Promise.all([
    config.exposeHttpServer && config.httpPort && stopAppWithPort(config.httpPort),
    config.exposeHttpsServer && config.httpsPort && stopAppWithPort(config.httpsPort),
  ]);
}
