import {getLocalIp} from '../../utils/net.js';

export interface ServerInfo {
  ipv4: string | undefined;
  ipv6: string | undefined;
  httpPort: string | undefined;
  httpsPort: string | undefined;
}

export async function getServerInfo(
  params: Pick<ServerInfo, 'httpPort' | 'httpsPort'>
): Promise<ServerInfo> {
  const {httpPort, httpsPort} = params;
  const {ipv4, ipv6} = getLocalIp();

  return {ipv4, ipv6, httpPort, httpsPort};
}
