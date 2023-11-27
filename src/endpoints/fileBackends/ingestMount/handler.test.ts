import {BaseContextType} from '../../contexts/types';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import ingestAgentToken from './handler';
import {IngestAgentTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('Agent token ingestd', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<IngestAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {tokenId: token.resourceId, workspaceId: workspace.resourceId}
  );

  const result = await ingestAgentToken(context, instData);
  assertEndpointResultOk(result);

  if (result.jobId) {
    await executeJob(context, result.jobId);
    await waitForJob(context, result.jobId);
  }

  const ingestdTokenExists = await context.semantic.agentToken.existsByQuery(
    EndpointReusableQueries.getByResourceId(token.resourceId)
  );

  expect(ingestdTokenExists).toBeFalsy();
});
