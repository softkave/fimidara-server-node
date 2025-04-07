import {kIjxUtils} from '../../contexts/ijx/injectables.js';

export function getShardRunnerPubSubAlertChannel(params: {queueKey: string}) {
  return `${params.queueKey}-wakeup`;
}

export function getShardRunnerPubSubOutputChannel(params: {
  queueKey: string;
  id: string;
}) {
  return `${params.queueKey}-${params.id}`;
}

export function isActiveShardRunner(params: {queueKey: string}) {
  const activeShardRunners = kIjxUtils.runtimeState().getActiveShardRunners();
  return activeShardRunners?.[params.queueKey];
}

export function setActiveShardRunner(params: {queueKey: string}) {
  let activeShardRunners = kIjxUtils.runtimeState().getActiveShardRunners();

  if (!activeShardRunners) {
    activeShardRunners = {};
  }

  activeShardRunners[params.queueKey] = true;
  kIjxUtils.runtimeState().setActiveShardRunners(activeShardRunners);
}

export function unsetActiveShardRunner(params: {queueKey: string}) {
  let activeShardRunners = kIjxUtils.runtimeState().getActiveShardRunners();

  if (!activeShardRunners) {
    activeShardRunners = {};
  }

  delete activeShardRunners[params.queueKey];
  kIjxUtils.runtimeState().setActiveShardRunners(activeShardRunners);
}
