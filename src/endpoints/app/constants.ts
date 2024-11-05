import {availableParallelism} from 'os';

export const kAppConstants = {
  /** app records heartbeat to DB after every `heartbeatInterval` */
  heartbeatInterval: 5 * 60 * 1000, // 5 minutes
  /** acceptable heartbeat misses before an app is considered not active */
  activeAppHeartbeatDelayFactor: 3,
  defaultRunnerCount: Math.min(2, availableParallelism()),
};
