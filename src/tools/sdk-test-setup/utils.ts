import {faker} from '@faker-js/faker';
import {promises as fspromises} from 'fs';
import {getMongoConnection} from '../../db/connection';
import {Workspace} from '../../definitions/workspace';
import {INTERNAL_createAgentToken} from '../../endpoints/agentTokens/addToken/utils';
import {getPublicAgentToken} from '../../endpoints/agentTokens/utils';
import {addAssignedPermissionGroupList} from '../../endpoints/assignedItems/addAssignedItems';
import {SemanticProviderMutationRunOptions} from '../../endpoints/contexts/semantic/types';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../../endpoints/contexts/utils';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/email/NoopEmailProviderContext';
import INTERNAL_createWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils';
import {fimidaraConfig} from '../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {serverLogger} from '../../utils/logger/loggerUtils';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {kSemanticModels} from '../../endpoints/contexts/injectables';

async function setupContext() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    models,
    () => connection.close()
  );
  await ctx.init();
  return ctx;
}

async function insertWorkspace(opts: SemanticProviderMutationRunOptions) {
  const companyName = faker.company.name();
  return await INTERNAL_createWorkspace(
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: 'For SDK tests',
    },
    SYSTEM_SESSION_AGENT,
    undefined,
    opts
  );
}

async function createAgentToken(
  workspace: Workspace,
  opts: SemanticProviderMutationRunOptions
) {
  const token = await INTERNAL_createAgentToken(
    SYSTEM_SESSION_AGENT,
    workspace,
    {
      name: faker.lorem.words(2),
      description: 'Agent token for SDK tests',
    },
    opts
  );
  appAssert(token.workspaceId);
  const tokenStr = getPublicAgentToken(token).tokenStr;
  return {tokenStr, token};
}

export async function setupSDKTestReq() {
  const context = await setupContext();
  const {workspace, token, tokenStr} = await kSemanticModels
    .utils()
    .withTxn(async opts => {
      const {workspace, adminPermissionGroup} = await insertWorkspace(opts);
      const {token, tokenStr} = await createAgentToken(workspace, opts);
      await addAssignedPermissionGroupList(
        SYSTEM_SESSION_AGENT,
        workspace.resourceId,
        [{permissionGroupId: adminPermissionGroup.resourceId}],
        token.resourceId,
        false, // don't delete existing assigned permission groups
        true, // skip permission groups check
        /** skip auth check */ true,
        opts
      );
      return {workspace, token, tokenStr};
    });

  try {
    const jsSdkTestEnvFilepath = './sdk/js-sdk/.env.test';
    await fspromises.access(jsSdkTestEnvFilepath);

    // TODO: pick server URL port from env file
    const envText = `FIMIDARA_TEST_WORKSPACE_ID="${workspace.resourceId}"
FIMIDARA_TEST_WORKSPACE_ROOTNAME="${workspace.rootname}"
FIMIDARA_TEST_AUTH_TOKEN="${tokenStr}"
FIMIDARA_TEST_FILEPATH="/src/testutils/testdata/testfile.txt"
FIMIDARA_SERVER_URL="http://localhost:5005"`;
    await fspromises.writeFile(jsSdkTestEnvFilepath, envText, 'utf-8');
    console.log('Wrote to js sdk .env.test file');
  } catch (error: unknown) {
    console.log('Error writing .env.test file');
    console.error(error);
  }

  serverLogger.info(`Workspace ID: ${workspace.resourceId}`);
  serverLogger.info(`Workspace rootname: ${workspace.rootname}`);
  serverLogger.info(`Agent token ID: ${token.resourceId}`);
  serverLogger.info(`Agent token token: ${tokenStr}`);
  await context.dispose();
}
