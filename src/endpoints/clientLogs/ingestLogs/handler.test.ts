import {afterAll, beforeAll, describe, test} from 'vitest';
import {getTimestamp} from '../../../utils/dateFns.js';
import {waitTimeout} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  mockExpressRequestForPublicAgent,
} from '../../testHelpers/utils.js';
import ingestLogs from './handler.js';
import {ClientLog, IngestLogsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
        service: 'test',
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
