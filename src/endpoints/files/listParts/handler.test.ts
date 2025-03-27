import {sampleSize} from 'lodash-es';
import {getRandomInt} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
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
import {partDetailsListExtractor} from '../utils/extractPublicPart.js';
import {InputFilePart, writeFileParts} from '../utils/filePart.js';
import listParts from './handler.js';
import {ListPartsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('listParts', () => {
  test.each([{spotty: true}, {spotty: false}])(
    'file details returned, params=%s',
    async ({spotty}) => {
      const {userToken, sessionAgent} = await insertUserForTest();
      const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
      const {rawFile: file} = await insertFileForTest(userToken, workspace);
      const partLength = 10;
      const clientMultipartId = '1';
      const internalMultipartId = '2';
      await kIjxSemantic.utils().withTxn(async txn => {
        await kIjxSemantic
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
        .map((part: number): InputFilePart => {
          return {
            part,
            multipartId: clientMultipartId,
            size: 10,
            partId: part.toString(),
          };
        });

      await writeFileParts({
        opts: null,
        agent: sessionAgent,
        workspaceId: workspace.resourceId,
        fileId: file.resourceId,
        parts,
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

  const page01Req = RequestData.fromExpressRequest<ListPartsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      continuationToken,
      filepath: stringifyFilenamepath(file, workspace.rootname),
    }
  );
  const page01 = await listParts(page01Req);
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
