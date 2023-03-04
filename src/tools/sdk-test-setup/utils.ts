import {faker} from '@faker-js/faker';
import {getMongoConnection} from '../../db/connection';
import {SYSTEM_SESSION_AGENT} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {internalCreateAgentToken} from '../../endpoints/agentTokens/addToken/utils';
import {getPublicAgentToken} from '../../endpoints/agentTokens/utils';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {IBaseContext} from '../../endpoints/contexts/types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
} from '../../endpoints/contexts/utils';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/NoopEmailProviderContext';
import internalCreateWorkspace from '../../endpoints/workspaces/addWorkspace/internalCreateWorkspace';
import {makeRootnameFromName} from '../../endpoints/workspaces/utils';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {consoleLogger} from '../../utils/logger/logger';

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

  return ctx;
}

async function insertWorkspace(context: IBaseContext) {
  const companyName = faker.company.name();
  return await internalCreateWorkspace(
    context,
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: 'For SDK tests',
    },
    SYSTEM_SESSION_AGENT
  );
}

async function createAgentToken(
  context: IBaseContext,
  workspace: IWorkspace,
  adminPermissionGroupId: string
) {
  const token = await internalCreateAgentToken(context, SYSTEM_SESSION_AGENT, workspace, {
    name: faker.lorem.words(2),
    description: 'Program access token for SDK tests',
  });
  const tokenStr = getPublicAgentToken(context, token).tokenStr;
  return {token, tokenStr};
}

export async function setupSDKTestReq() {
  const context = await setupContext();
  const {workspace, adminPermissionGroup} = await insertWorkspace(context);
  const {token, tokenStr} = await createAgentToken(
    context,
    workspace,
    adminPermissionGroup.resourceId
  );

  consoleLogger.info(`Workspace ID: ${workspace.resourceId}`);
  consoleLogger.info(`Workspace rootname: ${workspace.rootname}`);
  consoleLogger.info(`Program access token ID: ${token.resourceId}`);
  consoleLogger.info(`Program access token token: ${tokenStr}`);
  await context.dispose();
  return {workspace, token, tokenStr};
}
