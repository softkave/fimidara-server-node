import {sampleSize} from 'lodash-es';
import {getRandomInt} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import RequestData from '../../RequestData.js';
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
import {writePartMetas} from '../utils/partMeta.js';
import getPartDetails from './handler.js';
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
      const {workspace} = await insertWorkspaceForTest(userToken);
      const {file} = await insertFileForTest(userToken, workspace);
      const partLength = 10;
      const clientMultipartId = '1';
      await kSemanticModels.utils().withTxn(async txn => {
        await kSemanticModels
          .file()
          .updateOneById(file.resourceId, {partLength, clientMultipartId}, txn);
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
        .map((part: number): FilePersistenceUploadPartResult => {
          return {
            part,
            multipartId: clientMultipartId,
            size: 10,
            partId: part.toString(),
          };
        });
      await writePartMetas({parts, fileId: file.resourceId});

      const pageSize = 5;
      const page01Req =
        RequestData.fromExpressRequest<GetPartDetailsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {pageSize, filepath: stringifyFilenamepath(file, workspace.rootname)}
        );
      const page01 = await getPartDetails(page01Req);

      assertEndpointResultOk(page01);
      expect(page01.clientMultipartId).toEqual(clientMultipartId);
      expect(page01.details).toEqual(
        parts.slice(0, Math.min(pageSize, partLength))
      );

      const page02Req =
        RequestData.fromExpressRequest<GetPartDetailsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            pageSize,
            fromPart: pageSize,
            filepath: stringifyFilenamepath(file, workspace.rootname),
          }
        );
      const page02 = await getPartDetails(page02Req);

      assertEndpointResultOk(page02);
      expect(page02.clientMultipartId).toEqual(clientMultipartId);
      expect(page02.details).toEqual(parts.slice(pageSize, pageSize * 2));

      const page03Req =
        RequestData.fromExpressRequest<GetPartDetailsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            pageSize,
            fromPart: pageSize * 2,
            filepath: stringifyFilenamepath(file, workspace.rootname),
          }
        );
      const page03 = await getPartDetails(page03Req);

      assertEndpointResultOk(page03);
      expect(page03.clientMultipartId).toEqual(clientMultipartId);
      expect(page03.details).toEqual(parts.slice(pageSize * 2, pageSize * 3));
    }
  );
});
