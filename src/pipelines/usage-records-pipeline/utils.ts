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
 */

import assert from 'assert';
import {defaultTo} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getUsageRecordModel} from '../../db/usageRecord';
import {getWorkspaceModel} from '../../db/workspace';
import {systemAgent} from '../../definitions/system';
import {
  IUsageRecord,
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  UsageSummationType,
} from '../../definitions/usageRecord';
import {IUsageThresholdLock, IWorkspace} from '../../definitions/workspace';
import {usageRecordConstants} from '../../endpoints/usageRecords/constants';
import {
  extractProdEnvsSchema,
  getAppVariables,
} from '../../resources/appVariables';
import getNewId from '../../utilities/getNewId';

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

  // set to the previous month
  // will set to dec if it is january
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

async function sumUsageRecordsLevel1(
  connection: Connection,
  recordLevel2: IUsageRecord
) {
  let fromDate = recordLevel2.lastUpdatedAt || getStartOfMonth();
  const endDate = getEndOfMonth();
  let lastCount = 0;
  let sumUsage = 0;
  let sumCost = 0;
  const model = makeUsageRecordModel(connection);
  do {
    const records = await model
      .find({
        workspaceId: recordLevel2.workspaceId,
        category: recordLevel2.category,
        createdAt: {$gte: fromDate, $lt: endDate},
        fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
        summationType: UsageSummationType.One,
      })
      .sort({createdAt: 1})
      .limit(1000)
      .lean()
      .exec();

    lastCount = records.length;
    records.forEach(cur => {
      sumUsage += cur.usage;
      sumCost += cur.usageCost;
    });

    fromDate = records[records.length - 1].createdAt;
  } while (lastCount > 0);

  return {sumUsage, sumCost};
}

async function getUsageRecordsLevel2(
  connection: Connection,
  workspaceId: string
) {
  const model = makeUsageRecordModel(connection);
  const month = getRecordingMonth();
  const year = getRecordingYear();
  const records: IUsageRecord[] = await model
    .find({
      workspaceId,
      month,
      year,
      fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
      summationType: UsageSummationType.Two,
    })
    .lean()
    .exec();

  Object.values(UsageRecordCategory).map(k => {
    const record = records.find(r => r.category === k);
    if (!record) {
      records.push({
        workspaceId,
        month,
        year,
        resourceId: getNewId(),
        createdAt: new Date(),
        createdBy: systemAgent,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: systemAgent,
        category: k,
        summationType: UsageSummationType.Two,
        fulfillmentStatus: UsageRecordFulfillmentStatus.Fulfilled,
        usage: 0,
        usageCost: 0,
        artifacts: [],
      });
    }
  });

  return records;
}

async function incrementRecordLevel2(
  connection: Connection,
  recordLevel2: IUsageRecord
) {
  const {sumUsage, sumCost} = await sumUsageRecordsLevel1(
    connection,
    recordLevel2
  );

  recordLevel2.usage += sumUsage;
  recordLevel2.usageCost += sumCost;
  recordLevel2.lastUpdatedAt = new Date();
  recordLevel2.lastUpdatedBy = systemAgent;
  return recordLevel2;
}

async function aggregateRecordsLevel2ExcludingTotal(
  connection: Connection,
  workspaceId: string
) {
  const records = await getUsageRecordsLevel2(connection, workspaceId);
  const promises = records.map(r => incrementRecordLevel2(connection, r));
  const results = await Promise.all(promises);
  return results;
}

async function aggregateRecordsLevel2(
  connection: Connection,
  workspaceId: string
) {
  const records = await aggregateRecordsLevel2ExcludingTotal(
    connection,
    workspaceId
  );

  const totalRecord = records.find(
    r => r.category === UsageRecordCategory.Total
  );

  assert(totalRecord, 'total record not found');
  records.forEach(cur => {
    totalRecord.usage += cur.usage;
    totalRecord.usageCost += cur.usageCost;
  });

  totalRecord.lastUpdatedAt = new Date();
  totalRecord.lastUpdatedBy = systemAgent;
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
  workspace: IWorkspace
) {
  const records = await aggregateRecordsLevel2(
    connection,
    workspace.resourceId
  );

  const thresholds = workspace.usageThresholds || {};
  const locks = workspace.usageThresholdLocks || {};
  records.forEach(r => {
    const threshold = thresholds[r.category];
    if (threshold && r.usageCost >= threshold.budget) {
      const usageLock: IUsageThresholdLock = {
        ...defaultTo(locks[r.category], {}),
        category: r.category,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: systemAgent,
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

async function tryAggregateRecordsInWorkspaceAndLockIfUsageExceeded(
  connection: Connection,
  workspace: IWorkspace
) {
  try {
    await aggregateRecordsInWorkspaceAndLockIfUsageExceeded(
      connection,
      workspace
    );
  } catch (e) {
    console.log(
      `
      Error processing workspace usage records 
      Workspace ID: ${workspace.resourceId} 
      Rootname: ${workspace.rootname}
      `
    );
    console.log(e);
  }
}

export async function aggregateRecords(connection: Connection) {
  const workspaces = await getWorkspaces(connection);
  const promises = workspaces.map(w =>
    tryAggregateRecordsInWorkspaceAndLockIfUsageExceeded(connection, w)
  );

  await Promise.all(promises);
}

export async function aggregateRecordsMain() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  await aggregateRecords(connection);
  await connection.close();
}
