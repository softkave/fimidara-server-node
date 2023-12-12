import {getTimestamp} from '../../../utils/dateFns';
import {waitTimeout} from '../../../utils/fns';
import {FimidaraLoggerServiceNames} from '../../../utils/logger/loggerUtils';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTest,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import ingestLogs from './handler';
import {ClientLog, IngestLogsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('ingestLogs', () => {
  test('client logs ingested', async () => {
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

    const result = await ingestLogs(reqData);
    assertEndpointResultOk(result);
    await waitTimeout(1000);
    // TODO: check that logs are saved correctly
  });
});
