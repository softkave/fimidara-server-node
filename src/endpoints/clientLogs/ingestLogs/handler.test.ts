import {getTimestamp} from '../../../utils/dateFns';
import {waitTimeout} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import ingestLogs from './handler';
import {ClientLog, IngestLogsEndpointParams} from './types';

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
