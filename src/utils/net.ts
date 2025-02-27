import os from 'os';

export function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const ipv4 = (interfaces.eth0 ?? interfaces.en0)?.find(
    info => info.family === 'IPv4'
  )?.address;
  const ipv6 = (interfaces.eth0 ?? interfaces.en0)?.find(
    info => info.family === 'IPv6'
  )?.address;

  return {ipv4, ipv6};
}
