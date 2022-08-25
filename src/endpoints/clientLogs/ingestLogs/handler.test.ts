import assert from 'assert';
import {Connection, Schema} from 'mongoose';
import {getMongoConnection} from '../../../db/connection';
import {
  extractEnvVariables,
  extractProdEnvsSchema,
} from '../../../resources/vars';
import {getDateString} from '../../../utilities/dateFns';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getLogicProviders,
  IBaseContext,
} from '../../contexts/BaseContext';
import MongoDBDataProviderContext from '../../contexts/MongoDBDataProviderContext';
import RequestData from '../../RequestData';
import {dropMongoConnection, genDbName} from '../../test-utils/helpers/mongo';
import {
  assertContext,
  assertEndpointResultOk,
  getTestEmailProvider,
  getTestFileProvider,
  mockExpressRequestForPublicAgent,
} from '../../test-utils/test-utils';
import ingestLogs from './handler';
import {IClientLog, IIngestLogsEndpointParams} from './types';

let context: IBaseContext | null = null;
let logsConnection: Connection | null = null;

beforeAll(async () => {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  appVariables.logsDbName = genDbName();
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  context = new BaseContext(
    new MongoDBDataProviderContext(connection),
    getTestEmailProvider(appVariables),
    await getTestFileProvider(appVariables),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders(),
    () => connection.close()
  );

  logsConnection = await getMongoConnection(
    context.appVariables.mongoDbURI,
    context.appVariables.logsDbName
  );
});

afterAll(async () => {
  await context?.dispose();
  await dropMongoConnection(logsConnection);
});

describe('ingestLogs', () => {
  test('client logs ingested', async () => {
    assertContext(context);
    const testLogs: IClientLog[] = [];
    for (let i = 0; i < 10; i++) {
      testLogs.push({
        level: 'error',
        message: `Test client log ${i}`,
        timestamp: getDateString(),
        stack: new Error().stack,
        service: 'fimidara-test',
      });
    }

    const reqData = RequestData.fromExpressRequest<IIngestLogsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {logs: testLogs}
    );

    const result = await ingestLogs(context, reqData);
    assertEndpointResultOk(result);
    assert(logsConnection);
    const model = logsConnection.model<IClientLog>(
      'log',
      new Schema<IClientLog>({message: String}),
      context.appVariables.logsCollectionName
    );

    const savedLogs = await model.find({}).lean().exec();
    expect(savedLogs.length).toBe(testLogs.length);
  });
});
