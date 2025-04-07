import {faker} from '@faker-js/faker';
import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import RequestData from '../../RequestData.js';
import {generateAWSS3Credentials} from '../../testHelpers/generate/fileBackend.js';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
} from '../../testHelpers/generate/utils.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {
  completeTests,
  matchExpects,
  testCombinations,
} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import updateFileBackendConfig from './handler.js';
import {
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult,
  UpdateFileBackendConfigInput,
} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('updateConfig s3', () => {
  test('combinations', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const updateDefs: GenerateTestFieldsDef<UpdateFileBackendConfigInput> = {
      credentials: () =>
        generateAWSS3Credentials() as unknown as Record<string, unknown>,
      name: () => faker.lorem.words(),
      description: () => faker.lorem.paragraph(),
    };
    const updates = await generateTestFieldsCombinations(
      updateDefs,
      TestFieldsPresetCombinations.incrementallyAdd
    );

    await testCombinations(updates, async update => {
      const {config} = await insertFileBackendConfigForTest(
        userToken,
        workspace.resourceId
      );

      const reqData =
        RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            configId: config.resourceId,
            config: update,
            workspaceId: workspace.resourceId,
          }
        );
      const result = await updateFileBackendConfig(reqData);
      assertEndpointResultOk(result);

      const updatedConfig = await kIjxSemantic
        .fileBackendConfig()
        .getOneById(result.config.resourceId);
      assert(updatedConfig);

      await matchExpects<
        [UpdateFileBackendConfigInput, UpdateFileBackendConfigEndpointResult]
      >(
        [
          {
            matcher: input => !!input.credentials,
            expect: async input => {
              const currentCreds = await kIjxUtils.secretsManager().getSecret({
                secretId: updatedConfig.secretId,
              });
              expect(currentCreds.text).toEqual(
                JSON.stringify(input.credentials)
              );
            },
          },
          {
            matcher: input => !!input.name,
            expect: (input, result) => {
              expect(updatedConfig.name).toBe(input.name);
              expect(result.config.name).toBe(input.name);
            },
          },
          {
            matcher: input => !!input.description,
            expect: (input, result) => {
              expect(updatedConfig.description).toBe(input.description);
              expect(result.config.description).toBe(input.description);
            },
          },
        ],
        update,
        result
      );
    });
  });

  test('fails if config with name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const [{config: config01}, {config: config02}] = await Promise.all([
      insertFileBackendConfigForTest(userToken, workspace.resourceId),
      insertFileBackendConfigForTest(userToken, workspace.resourceId),
    ]);

    const reqData01 =
      RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: config01.resourceId,
          config: {name: config01.name},
          workspaceId: workspace.resourceId,
        }
      );
    const reqData02 =
      RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: config02.resourceId,
          config: {name: config01.name},
          workspaceId: workspace.resourceId,
        }
      );

    await Promise.all([
      updateFileBackendConfig(reqData01),
      expectErrorThrown(
        async () => {
          await updateFileBackendConfig(reqData02);
        },
        error => {
          expect((error as Error).message).toBe(
            kReuseableErrors.config.configExists().message
          );
        }
      ),
    ]);
  });
});
