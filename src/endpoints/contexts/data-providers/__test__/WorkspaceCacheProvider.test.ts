import assert = require('assert');
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../../../db/connection';
import {getWorkspaceModel} from '../../../../db/workspace';
import {WorkspaceBillStatus} from '../../../../definitions/workspace';
import {getDate} from '../../../../utilities/dateFns';
import cast, {waitTimeout} from '../../../../utilities/fns';
import getNewId from '../../../../utilities/getNewId';
import {generateWorkspaces} from '../../../test-utils/generate-data/workspace';
import {dropMongoConnection} from '../../../test-utils/helpers/dropMongo';
import {getTestVars} from '../../../test-utils/vars';
import BaseContext from '../../BaseContext';
import {WorkspaceCacheProvider} from '../WorkspaceCacheProvider';
import {WorkspaceMongoDataProvider} from '../WorkspaceDataProvider';

let connection: Connection | null = null;

jest.setTimeout(50000); // 50 seconds
beforeAll(async () => {
  const testVars = getTestVars();
  const dbName = `test-db-workspace-cache-${getNewId()}`;
  connection = await getMongoConnection(testVars.mongoDbURI, dbName);
});

afterAll(async () => {
  if (connection) {
    await dropMongoConnection(connection);
    await connection.close();
  }
});

describe('WorkspaceCacheProvider', () => {
  test('data is refreshed', async () => {
    assert(connection);
    const workspaces = generateWorkspaces();
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
      /** dataProviders */ cast({
        workspace: new WorkspaceMongoDataProvider(connection),
      }),
      /** cacheProviders */ {workspace: provider},
      /** logicProviders */ emptyObject
    );
    await provider.init(context);

    let ws = await provider.getById(context, workspaces[0].resourceId);
    await model
      .updateOne(
        {resourceId: ws.resourceId},
        {
          $set: {
            billStatus: WorkspaceBillStatus.BillOverdue,
            billStatusAssignedAt: getDate(),
          },
        }
      )
      .exec();

    await waitTimeout(refreshIntervalMs);
    ws = await provider.getById(context, workspaces[0].resourceId);
    expect(ws.billStatus).toBe(WorkspaceBillStatus.BillOverdue);
  });
});
