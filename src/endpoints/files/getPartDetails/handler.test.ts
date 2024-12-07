import {sampleSize} from 'lodash-es';
import {getRandomInt} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {File} from '../../../definitions/file.js';
import {Workspace} from '../../../definitions/workspace.js';
import RequestData from '../../RequestData.js';
import {expectContainsEveryItemIn} from '../../testUtils/helpers/assertion.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {stringifyFilenamepath} from '../utils.js';
import {
  FilePartMeta,
  writeMultipartUploadPartMetas,
} from '../utils/multipartUploadMeta.js';
import getPartDetails, {partDetailsListExtractor} from './handler.js';
import {GetPartDetailsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getPartDetails', () => {
  test.each([{spotty: true}, {spotty: false}])(
    'file details returned, params=%s',
    async ({spotty}) => {
      const {userToken} = await insertUserForTest();
      const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
      const {rawFile: file} = await insertFileForTest(userToken, workspace);
      const partLength = 10;
      const clientMultipartId = '1';
      const internalMultipartId = '2';
      await kSemanticModels.utils().withTxn(async txn => {
        await kSemanticModels
          .file()
          .updateOneById(
            file.resourceId,
            {clientMultipartId, internalMultipartId},
            txn
          );
      });
      const possiblePartNums = Array.from({length: partLength}, (_, i) => i);
      const partNums = spotty
        ? sampleSize(
            possiblePartNums,
            getRandomInt(
              /** min is 1 because min is inclusive */ 1,
              /** max + 1 to include potential of having all parts */
              partLength + 1
            )
          )
        : possiblePartNums;
      const parts = partNums
        .sort((num1, num2) => num1 - num2)
        .map((part: number): FilePartMeta => {
          return {
            part,
            multipartId: clientMultipartId,
            size: 10,
            partId: part.toString(),
          };
        });
      await writeMultipartUploadPartMetas({
        parts,
        multipartId: internalMultipartId,
      });

      await callGetParts({
        userToken,
        file,
        workspace,
        parts,
        clientMultipartId,
      });
    }
  );
});

async function callGetParts(params: {
  userToken: AgentToken;
  file: File;
  workspace: Workspace;
  parts: FilePartMeta[];
  clientMultipartId: string;
  continuationToken?: string;
}) {
  const {
    userToken,
    file,
    workspace,
    parts,
    clientMultipartId,
    continuationToken,
  } = params;

  const page01Req =
    RequestData.fromExpressRequest<GetPartDetailsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        continuationToken,
        filepath: stringifyFilenamepath(file, workspace.rootname),
      }
    );
  const page01 = await getPartDetails(page01Req);
  assertEndpointResultOk(page01);

  expect(page01.clientMultipartId).toEqual(clientMultipartId);
  const pParts = partDetailsListExtractor(parts);
  expectContainsEveryItemIn(
    page01.details,
    pParts,
    part => part.part.toString() + part.size
  );

  if (page01.isDone) {
    expect(page01.continuationToken).toBeUndefined();
  } else {
    expect(page01.continuationToken).toBeDefined();
    await callGetParts({
      userToken,
      file,
      workspace,
      parts,
      clientMultipartId,
      continuationToken: page01.continuationToken,
    });
  }
}
