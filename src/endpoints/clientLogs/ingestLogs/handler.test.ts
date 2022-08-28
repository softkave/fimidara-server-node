import {Connection, Model, Schema, SchemaTypes} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {getDateString} from '../../../utilities/dateFns';
import {waitTimeout} from '../../../utilities/fns';
import {FimidaraLoggerServiceNames} from '../../../utilities/logger/loggerUtils';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  mockExpressRequestForPublicAgent,
} from '../../test-utils/test-utils';
import ingestLogs from './handler';
import {IClientLog, IIngestLogsEndpointParams} from './types';
import assert = require('assert');

let context: IBaseContext | null = null;
let logsConnection: Connection | null = null;
let model: Model<IClientLog> | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
  logsConnection = await getMongoConnection(
    context.appVariables.mongoDbURI,
    context.appVariables.logsDbName
  );

  model = logsConnection.model<IClientLog>(
    'log',
    new Schema<IClientLog>({meta: SchemaTypes.Map}),
    context.appVariables.logsCollectionName
  );
});

afterAll(async () => {
  await context?.dispose();
  await logsConnection?.close();
});

describe('ingestLogs', () => {
  test('client logs ingested', async () => {
    assertContext(context);
    const testLogs: IClientLog[] = [];
    const randomTag = Math.random().toString();
    for (let i = 0; i < 10; i++) {
      testLogs.push({
        level: 'error',
        message: `Test client log ${i}`,
        timestamp: getDateString(),
        stack: randomTag,
        service: FimidaraLoggerServiceNames.Test,
      });
    }

    const reqData = RequestData.fromExpressRequest<IIngestLogsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {logs: testLogs}
    );

    const result = await ingestLogs(context, reqData);
    assertEndpointResultOk(result);
    await waitTimeout(1000);
    assert(model);
    const savedLogs = await model.find({'meta.stack': randomTag}).lean().exec();
    console.dir(savedLogs);
    expect(savedLogs.length).toBe(testLogs.length);
  });
});
