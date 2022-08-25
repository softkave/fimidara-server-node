import assert from 'assert';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../../db/connection';
import {getWorkspaceModel} from '../../../../db/workspace';
import {WorkspaceBillStatus} from '../../../../definitions/workspace';
import {
  extractEnvVariables,
  extractProdEnvsSchema,
} from '../../../../resources/vars';
import {getDate} from '../../../../utilities/dateFns';
import cast, {waitTimeout} from '../../../../utilities/fns';
import {getNewId} from '../../../../utilities/resourceId';
import {generateTestWorkspaces} from '../../../test-utils/generate-data/workspace';
import {dropMongoConnection} from '../../../test-utils/helpers/mongo';
import BaseContext, {getDataProviders} from '../../BaseContext';
import {WorkspaceCacheProvider} from '../WorkspaceCacheProvider';

let connection: Connection | null = null;

jest.setTimeout(50000); // 50 seconds
beforeAll(async () => {
  const testVars = extractEnvVariables(extractProdEnvsSchema);
  const dbName = `test-db-workspace-cache-${getNewId()}`;
  connection = await getMongoConnection(testVars.mongoDbURI, dbName);
});

afterAll(async () => {
  if (connection) {
    await dropMongoConnection(connection);
  }
});

async function setupContextAndWorkspaces() {
  assert(connection);
  const workspaces = generateTestWorkspaces();
  const model = getWorkspaceModel(connection);
  await model.insertMany(workspaces);
  const emptyObject = cast<any>({});
  const refreshIntervalMs = 1000 * 5; // 5 seconds
  const provider = new WorkspaceCacheProvider(refreshIntervalMs);
  const context = new BaseContext(
    /** data */ emptyObject,
    /** emailProvider */ emptyObject,
    /** fileBackend */ emptyObject,
    /** appVariables */ emptyObject,
    /** dataProviders */ getDataProviders(connection),
    /** cacheProviders */ {workspace: provider},
    /** logicProviders */ emptyObject
  );

  await provider.init(context);
  return {context, provider, model, workspaces, refreshIntervalMs};
}

describe('WorkspaceCacheProvider', () => {
  test('data is refreshed', async () => {
    const {context, provider, model, workspaces, refreshIntervalMs} =
      await setupContextAndWorkspaces();

    let w1 = await provider.getById(context, workspaces[0].resourceId);
    await model
      .updateOne(
        {resourceId: w1.resourceId},
        {
          $set: {
            billStatus: WorkspaceBillStatus.BillOverdue,
            billStatusAssignedAt: getDate(),
          },
        }
      )
      .exec();

    await waitTimeout(refreshIntervalMs + 100); // wait for the refresh interval + 100ms
    w1 = await provider.getById(context, workspaces[0].resourceId);
    expect(w1.billStatus).toBe(WorkspaceBillStatus.BillOverdue);
  });

  test('refresh interval is updated', async () => {
    const {context, provider, model, workspaces, refreshIntervalMs} =
      await setupContextAndWorkspaces();
    const newRefreshIntervalMs = refreshIntervalMs / 2;
    await provider.setRefreshIntervalMs(context, newRefreshIntervalMs);

    let w1 = await provider.getById(context, workspaces[0].resourceId);
    await model
      .updateOne(
        {resourceId: w1.resourceId},
        {
          $set: {
            billStatus: WorkspaceBillStatus.BillOverdue,
            billStatusAssignedAt: getDate(),
          },
        }
      )
      .exec();

    await waitTimeout(newRefreshIntervalMs + 100); // wait for the refresh interval + 100ms
    w1 = await provider.getById(context, workspaces[0].resourceId);
    expect(w1.billStatus).toBe(WorkspaceBillStatus.BillOverdue);
  });
});
