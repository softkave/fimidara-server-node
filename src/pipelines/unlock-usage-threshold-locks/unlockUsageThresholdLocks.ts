import {Connection} from 'mongoose';
import {getWorkspaceModel} from '../../db/workspace';
import {systemAgent} from '../../definitions/system';

/**
 * For all workspaces,
 * unlock usage threshold locks if they are currently locked
 * and the workspace doesn't have unpaid bills.
 *
 * TODO:
 * Currently we don't have a way to pay bills,
 * so we're just unlocking the locks.
 */

export async function unlockUsageThresholdLocks(connection: Connection) {
  const model = getWorkspaceModel(connection);
  const workspaces = await model.find({}).lean().exec();
  const promises = [];
  for (const workspace of workspaces) {
    const usageThresholdLocks = workspace.usageThresholdLocks ?? {};
    const locks = Object.values(usageThresholdLocks);
    let anyLocked = false;
    for (const lock of locks) {
      if (lock.locked) {
        lock.locked = false;
        lock.lastUpdatedAt = new Date();
        lock.lastUpdatedBy = systemAgent;
        anyLocked = true;
      }
    }

    if (anyLocked) {
      const p = model
        .updateOne({resourceId: workspace.resourceId}, {usageThresholdLocks: usageThresholdLocks})
        .exec();
      promises.push(p);
    }
  }

  await Promise.all(promises);
}
