import RequestData from '../../RequestData.js';
import {completeTests, skTest} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {stringifyFilenamepath} from '../utils.js';
import getFileDetails from './handler.js';
import {GetFileDetailsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getFileDetails', () => {
  skTest.run('file details returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const instData = RequestData.fromExpressRequest<GetFileDetailsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await getFileDetails(instData);
    assertEndpointResultOk(result);
    expect(result.file).toEqual(file);
  });
});
