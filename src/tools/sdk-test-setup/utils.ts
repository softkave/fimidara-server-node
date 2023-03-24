import {faker} from '@faker-js/faker';
import {getMongoConnection} from '../../db/connection';
import {SYSTEM_SESSION_AGENT} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {internalCreateAgentToken} from '../../endpoints/agentTokens/addToken/utils';
import {getPublicAgentToken} from '../../endpoints/agentTokens/utils';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../endpoints/contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../endpoints/contexts/semantic/utils';
import {IBaseContext} from '../../endpoints/contexts/types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from '../../endpoints/contexts/utils';
import {consoleLogger} from '../../endpoints/globalUtils';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/NoopEmailProviderContext';
import internalCreateWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {appAssert} from '../../utils/assertion';

async function setupContext() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );
  const emailProvider = new NoopEmailProviderContext();
  const models = getMongoModels(connection);
  const data = getDataProviders(models);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    data,
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );

  await ingestDataIntoMemStore(ctx);
  return ctx;
}

async function insertWorkspace(
  context: IBaseContext,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const companyName = faker.company.name();
  return await internalCreateWorkspace(
    context,
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
  context: IBaseContext,
  workspace: IWorkspace,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const token = await internalCreateAgentToken(
    context,
    SYSTEM_SESSION_AGENT,
    workspace,
    {
      name: faker.lorem.words(2),
      description: 'Program access token for SDK tests',
    },
    opts
  );
  appAssert(token.workspaceId);
  const tokenStr = getPublicAgentToken(context, token).tokenStr;
  return {tokenStr, token};
}

export async function setupSDKTestReq() {
  const context = await setupContext();
  const {workspace, token, tokenStr} = await executeWithMutationRunOptions(context, async opts => {
    const {workspace, adminPermissionGroup} = await insertWorkspace(context, opts);
    const {token, tokenStr} = await createAgentToken(context, workspace, opts);
    return {workspace, token, tokenStr};
  });

  consoleLogger.info(`Workspace ID: ${workspace.resourceId}`);
  consoleLogger.info(`Workspace rootname: ${workspace.rootname}`);
  consoleLogger.info(`Program access token ID: ${token.resourceId}`);
  consoleLogger.info(`Program access token token: ${tokenStr}`);
  await context.dispose();
}
