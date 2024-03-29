import assert = require('assert');
import {add} from 'date-fns';
import {defaultTo} from 'lodash';
import {Connection} from 'mongoose';
import {getUsageRecordModel} from '../../db/usageRecord';
import {getWorkspaceModel} from '../../db/workspace';
import {kFimidaraResourceType} from '../../definitions/system';
import {
  UsageRecord,
  UsageRecordCategoryMap,
  UsageRecordFulfillmentStatus,
  UsageRecordFulfillmentStatusMap,
  UsageSummationTypeMap,
} from '../../definitions/usageRecord';
import {UsageThresholdLock, Workspace} from '../../definitions/workspace';
import {kUtilsInjectables} from '../../endpoints/contexts/injection/injectables';
import {usageRecordConstants} from '../../endpoints/usageRecords/constants';
import {kSystemSessionAgent} from '../../utils/agent';
import {getTimestamp} from '../../utils/dateFns';
import {getNewIdForResource} from '../../utils/resource';

/**
 * Aggregates usage records by month by category and total.
 *
 * - get workspaces
 * - for each workspace, get usage records level 2
 * - for each usage record level 2, get usage records level 1 not yet summed in
 *   reporting month
 * - sum usage records level 1 and add to usage records level 2
 * - sum total usage record level 2
 * - lock usage or workspace if usage exceeds limit
 * - [not in here] server refreshes workspace cache
 *
 * - in similar manner, sum up dropped usage records but do not lock workspace
 */

function makeUsageRecordModel(connection: Connection) {
  const m = getUsageRecordModel(connection);
  return m;
}

function makeWorkspaceModel(connection: Connection) {
  const m = getWorkspaceModel(connection);
  return m;
}

async function getWorkspaces(connection: Connection) {
  const model = makeWorkspaceModel(connection);
  const workspaces = await model.find({}).lean().exec();
  return workspaces;
}

export function getRecordingMonth() {
  const d = new Date();
  const m = d.getMonth();
  return m;
}

export function getRecordingYear() {
  const d = new Date();
  const y = d.getFullYear();
  return y;
}

function getStartOfMonth() {
  const d = new Date();
  const m = getRecordingMonth();

  // set to the previous month will set to dec if it is january
  d.setMonth(m - 1);

  // set to one day after the last recording date of the previous month
  d.setDate(usageRecordConstants.recordingMonthEndDate + 1);
  d.setHours(0, 0, 0, 0); // set to midnight
  return d;
}

function getEndOfMonth() {
  const d = new Date();
  const m = getRecordingMonth();
  d.setMonth(m);
  d.setDate(usageRecordConstants.recordingMonthEndDate);
  d.setHours(23, 59, 59, 999); // set to end of day
  return d;
}

async function sumUsageRecordsLevel1(connection: Connection, recordLevel2: UsageRecord) {
  let fromDate = recordLevel2.lastUpdatedAt ?? getStartOfMonth();
  const endDate = getEndOfMonth();
  let totalCount = 0;
  let lastCount = 0;
  let sumUsage = 0;
  let sumCost = 0;
  const model = makeUsageRecordModel(connection);
  do {
    const records = await model
      .find({
        workspaceId: recordLevel2.workspaceId,
        category: recordLevel2.category,
        createdAt: {$gt: fromDate, $lt: endDate},
        fulfillmentStatus: recordLevel2.fulfillmentStatus,
        summationType: UsageSummationTypeMap.Instance,
      })
      .sort({createdAt: 1})
      .limit(500)
      .skip(totalCount)
      .lean()
      .exec();

    lastCount = records.length;
    totalCount += lastCount;
    records.forEach(cur => {
      sumUsage += cur.usage;
      sumCost += cur.usageCost;
    });

    if (records[records.length - 1]) {
      const lastDate = add(new Date(records[records.length - 1].createdAt), {
        seconds: 1,
      });

      fromDate = getTimestamp(lastDate);
    }
  } while (lastCount > 0);

  return {sumUsage, sumCost, totalCount};
}

async function getUsageRecordsLevel2(
  connection: Connection,
  workspaceId: string,
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  const model = makeUsageRecordModel(connection);
  const month = getRecordingMonth();
  const year = getRecordingYear();
  const records: UsageRecord[] = await model
    .find({
      workspaceId,
      month,
      year,
      fulfillmentStatus,
      summationType: UsageSummationTypeMap.Month,
    })
    .lean()
    .exec();

  Object.values(UsageRecordCategoryMap).map(k => {
    const record = records.find(r => r.category === k);
    if (!record) {
      records.push({
        workspaceId,
        month,
        year,
        fulfillmentStatus,
        resourceId: getNewIdForResource(kFimidaraResourceType.UsageRecord),
        createdAt: getTimestamp(),
        createdBy: kSystemSessionAgent,
        lastUpdatedAt: getTimestamp(),
        lastUpdatedBy: kSystemSessionAgent,
        category: k,
        summationType: UsageSummationTypeMap.Month,
        usage: 0,
        usageCost: 0,
        artifacts: [],
        isDeleted: false,
      });
    }
  });

  return records;
}

async function incrementRecordLevel2(connection: Connection, recordLevel2: UsageRecord) {
  const {sumUsage, sumCost} = await sumUsageRecordsLevel1(connection, recordLevel2);
  recordLevel2.usage += sumUsage;
  recordLevel2.usageCost += sumCost;
  recordLevel2.lastUpdatedAt = getTimestamp();
  recordLevel2.lastUpdatedBy = kSystemSessionAgent;
  return recordLevel2;
}

async function aggregateRecordsLevel2ExcludingTotal(
  connection: Connection,
  workspaceId: string,
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  const records = await getUsageRecordsLevel2(connection, workspaceId, fulfillmentStatus);
  const promises = records.map(r => incrementRecordLevel2(connection, r));
  const results = await Promise.all(promises);
  return results;
}

async function aggregateRecordsLevel2(
  connection: Connection,
  workspaceId: string,
  fulfillmentStatus: UsageRecordFulfillmentStatus
) {
  const records = await aggregateRecordsLevel2ExcludingTotal(
    connection,
    workspaceId,
    fulfillmentStatus
  );
  const totalRecord = records.find(r => r.category === UsageRecordCategoryMap.Total);
  assert(totalRecord, 'Total usage record not found');
  totalRecord.usageCost = 0;
  records.forEach(cur => {
    if (cur.category !== UsageRecordCategoryMap.Total) {
      // only keep track of the usage cost for the total record cause each
      // category has its own usage unit, like bytes for storage and count for db
      // objects
      totalRecord.usageCost += cur.usageCost;
    }
  });

  totalRecord.lastUpdatedAt = getTimestamp();
  totalRecord.lastUpdatedBy = kSystemSessionAgent;
  const model = makeUsageRecordModel(connection);
  await model.bulkWrite(
    records.map(r => ({
      updateOne: {
        filter: {resourceId: r.resourceId},
        update: r,
        upsert: true,
      },
    }))
  );

  return records;
}

async function aggregateRecordsInWorkspaceAndLockIfUsageExceeded(
  connection: Connection,
  workspace: Workspace
) {
  const records = await aggregateRecordsLevel2(
    connection,
    workspace.resourceId,
    UsageRecordFulfillmentStatusMap.Fulfilled
  );

  const thresholds = workspace.usageThresholds ?? {};
  const locks = workspace.usageThresholdLocks ?? {};
  records.forEach(r => {
    const threshold = thresholds[r.category];
    if (threshold && r.usageCost >= threshold.budget) {
      const usageLock: UsageThresholdLock = {
        ...defaultTo(locks[r.category], {}),
        category: r.category,
        lastUpdatedAt: getTimestamp(),
        lastUpdatedBy: kSystemSessionAgent,
        locked: true,
      };

      locks[r.category] = usageLock;
    }
  });

  const model = makeWorkspaceModel(connection);
  await model
    .updateOne({resourceId: workspace.resourceId}, {usageThresholdLocks: locks})
    .exec();
}

async function aggregateDroppedRecordsInWorkspace(
  connection: Connection,
  workspace: Workspace
) {
  await aggregateRecordsLevel2(
    connection,
    workspace.resourceId,
    UsageRecordFulfillmentStatusMap.Dropped
  );
}

async function tryAggregateRecordsInWorkspace(
  connection: Connection,
  workspace: Workspace
) {
  try {
    await aggregateRecordsInWorkspaceAndLockIfUsageExceeded(connection, workspace);
    await aggregateDroppedRecordsInWorkspace(connection, workspace);
  } catch (e) {
    kUtilsInjectables.logger().log(
      `
      Error processing workspace usage records 
      Workspace ID: ${workspace.resourceId} 
      Rootname: ${workspace.rootname}
      `
    );
    kUtilsInjectables.logger().error(e);
  }
}

export async function aggregateRecords(connection: Connection) {
  const workspaces = await getWorkspaces(connection);
  const promises = workspaces.map(w => tryAggregateRecordsInWorkspace(connection, w));
  await Promise.all(promises);
}
