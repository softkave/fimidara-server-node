import {Connection, Model, Schema, SchemaTypes} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {getTimestamp} from '../../../utils/dateFns';
import {waitTimeout} from '../../../utils/fns';
import {FimidaraLoggerServiceNames} from '../../../utils/logger/loggerUtils';
import RequestData from '../../RequestData';
import {BaseContext} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import ingestLogs from './handler';
import {ClientLog, IngestLogsEndpointParams} from './types';
import assert = require('assert');

let context: BaseContext | null = null;
let logsConnection: Connection | null = null;
let model: Model<ClientLog> | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
  logsConnection = await getMongoConnection(
    context.appVariables.mongoDbURI,
    context.appVariables.logsDbName
  );

  model = logsConnection.model<ClientLog>(
    'log',
    new Schema<ClientLog>({meta: SchemaTypes.Map}),
    context.appVariables.logsCollectionName
  );
});

afterAll(async () => {
  await completeTest({context});
  await logsConnection?.close();
});

describe('ingestLogs', () => {
  test('client logs ingested', async () => {
    assertContext(context);
    const testLogs: ClientLog[] = [];
    const randomTag = Math.random().toString();
    for (let i = 0; i < 10; i++) {
      testLogs.push({
        level: 'error',
        message: `Test client log ${i}`,
        timestamp: getTimestamp(),
        stack: randomTag,
        service: FimidaraLoggerServiceNames.Test,
      });
    }

    const reqData = RequestData.fromExpressRequest<IngestLogsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {logs: testLogs}
    );

    const result = await ingestLogs(context, reqData);
    assertEndpointResultOk(result);
    await waitTimeout(1000);
    assert(model);
    const savedLogs = await model.find({'meta.stack': randomTag}).lean().exec();
    expect(savedLogs.length).toBe(testLogs.length);
  });
});
