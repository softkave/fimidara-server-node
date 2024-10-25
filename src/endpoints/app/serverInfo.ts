import path from 'path';
import {getLocalIp} from '../../utils/net.js';
import {memoizedGetPackageJson} from '../../utils/package.js';

export interface ServerInfo {
  ipv4: string | undefined;
  ipv6: string | undefined;
  httpPort: string | undefined;
  httpsPort: string | undefined;
  version: string | undefined;
}

export async function getServerInfo(
  params: Pick<ServerInfo, 'httpPort' | 'httpsPort'>
): Promise<ServerInfo> {
  const {httpPort, httpsPort} = params;
  const {ipv4, ipv6} = getLocalIp();
  const {version} = await memoizedGetPackageJson(
    path.join(process.cwd(), './package.json')
  );

  return {ipv4, ipv6, version, httpPort, httpsPort};
}
