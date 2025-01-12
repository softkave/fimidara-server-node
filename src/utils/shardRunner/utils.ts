export function getShardRunnerPubSubAlertChannel(params: {queueKey: string}) {
  return `${params.queueKey}-wakeup`;
}

export function getShardRunnerPubSubOutputChannel(params: {
  queueKey: string;
  id: string;
}) {
  return `${params.queueKey}-${params.id}`;
}
