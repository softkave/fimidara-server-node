import {faker} from '@faker-js/faker';
import assert from 'assert';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import RequestData from '../../RequestData';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {generateAWSS3Credentials} from '../../testUtils/generate/fileBackend';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
} from '../../testUtils/generate/utils';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {
  completeTests,
  matchExpects,
  testCombinations,
} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateFileBackendConfig from './handler';
import {
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult,
  UpdateFileBackendConfigInput,
} from './types';

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
      credentials: () => generateAWSS3Credentials() as unknown as Record<string, unknown>,
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

      const instData =
        RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            configId: config.resourceId,
            config: update,
            workspaceId: workspace.resourceId,
          }
        );
      const result = await updateFileBackendConfig(instData);
      assertEndpointResultOk(result);

      const updatedConfig = await kSemanticModels
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
              const currentCreds = await kUtilsInjectables.secretsManager().getSecret({
                secretId: updatedConfig.secretId,
              });
              expect(currentCreds.text).toEqual(JSON.stringify(input.credentials));
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

    const instData01 =
      RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: config01.resourceId,
          config: {name: config01.name},
          workspaceId: workspace.resourceId,
        }
      );
    const instData02 =
      RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          configId: config02.resourceId,
          config: {name: config01.name},
          workspaceId: workspace.resourceId,
        }
      );

    await Promise.all([
      updateFileBackendConfig(instData01),
      expectErrorThrown(
        async () => {
          await updateFileBackendConfig(instData02);
        },
        error =>
          expect((error as Error).message).toBe(
            kReuseableErrors.config.configExists().message
          )
      ),
    ]);
  });
});
