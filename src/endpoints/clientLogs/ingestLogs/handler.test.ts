import {getTimestamp} from '../../../utils/dateFns';
import {waitTimeout} from '../../../utils/fns';
import {FimidaraLoggerServiceNames} from '../../../utils/logger/loggerUtils';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
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

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
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
    // TODO: check that logs are saved correctly
  });
});
