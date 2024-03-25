export function getLocalIp() {
  const {eth0} = os.networkInterfaces();
  const ipv4 = eth0?.find(info => info.family === 'IPv4')?.address;
  const ipv6 = eth0?.find(info => info.family === 'IPv6')?.address;
  return {ipv4, ipv6};
}
