import cors = require('cors');
import express = require('express');
import http = require('http');
import multer = require('multer');
import {expressjwt} from 'express-jwt';
import {getMongoConnection} from './db/connection';
import setupAgentTokensRESTEndpoints from './endpoints/agentTokens/setupRESTEndpoints';
import setupCollaborationRequestsRESTEndpoints from './endpoints/collaborationRequests/setupRESTEndpoints';
import setupCollaboratorsRESTEndpoints from './endpoints/collaborators/setupRESTEndpoints';
import {endpointConstants} from './endpoints/constants';
import BaseContext, {getFileProvider} from './endpoints/contexts/BaseContext';
import {SESEmailProviderContext} from './endpoints/contexts/EmailProviderContext';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from './endpoints/contexts/utils';
import {fileConstants} from './endpoints/files/constants';
import setupFilesRESTEndpoints from './endpoints/files/setupRESTEndpoints';
import setupFoldersRESTEndpoints from './endpoints/folders/setupRESTEndpoints';
import {consoleLogger, logger} from './endpoints/globalUtils';
import {startJobRunner} from './endpoints/jobs/runner';
import setupPermissionGroupsRESTEndpoints from './endpoints/permissionGroups/setupRESTEndpoints';
import setupPermissionItemsRESTEndpoints from './endpoints/permissionItems/setupRESTEndpoints';
import setupResourcesRESTEndpoints from './endpoints/resources/setupRESTEndpoints';
import {setupApp} from './endpoints/runtime/initAppSetup';
import setupTagsRESTEndpoints from './endpoints/tags/setupRESTEndpoints';
import setupUsageRecordsRESTEndpoints from './endpoints/usageRecords/setupRESTEndpoints';
import setupAccountRESTEndpoints from './endpoints/user/setupRESTEndpoints';
import setupWorkspacesRESTEndpoints from './endpoints/workspaces/setupRESTEndpoints';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {extractProdEnvsSchema, getAppVariables} from './resources/vars';

logger.info('server initialization');

const app = express();
const upload = multer({
  limits: {
    fieldNameSize: 100,
    fieldSize: 1 * 1024 * 1204,
    fields: 1024,
    fileSize: fileConstants.maxFileSizeInBytes,
    files: 1,
    parts: 10000,
    headerPairs: 2000,
  },
});

const httpServer = http.createServer(app);

// Match all origins
const whiteListedCorsOrigins = [/[\s\S]*/];
if (process.env.NODE_ENV !== 'production') {
  whiteListedCorsOrigins.push(/localhost/);
}

const corsOption: cors.CorsOptions = {
  origin: whiteListedCorsOrigins,
  optionsSuccessStatus: endpointConstants.httpStatusCode.ok,
  credentials: true,
};

if (process.env.NODE_ENV === 'production') {
  app.use(httpToHttps);
}

app.use(cors(corsOption));
app.use(express.json() as express.RequestHandler);

function setupJWT(ctx: BaseContext) {
  app.use(
    // TODO: do further research on JWT options, algorithms and best practices
    expressjwt({
      secret: ctx.appVariables.jwtSecret,
      credentialsRequired: false,
      algorithms: ['HS256'],
    })
  );
}

async function setup() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  // Run scripts here
  // End of scripts

  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  const emailProvider = new SESEmailProviderContext(appVariables.awsRegion);
  const ctx = new BaseContext(
    getDataProviders(models),
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );
  await ingestDataIntoMemStore(ctx);

  const defaultWorkspace = await setupApp(ctx);
  logger.info(`Default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT(ctx);
  setupCollaborationRequestsRESTEndpoints(ctx, app);
  setupCollaboratorsRESTEndpoints(ctx, app);
  setupFilesRESTEndpoints(ctx, app, upload);
  setupFoldersRESTEndpoints(ctx, app);
  setupWorkspacesRESTEndpoints(ctx, app);
  setupPermissionItemsRESTEndpoints(ctx, app);
  setupPermissionGroupsRESTEndpoints(ctx, app);
  setupAgentTokensRESTEndpoints(ctx, app);
  setupAccountRESTEndpoints(ctx, app);
  setupResourcesRESTEndpoints(ctx, app);
  setupTagsRESTEndpoints(ctx, app);
  setupUsageRecordsRESTEndpoints(ctx, app);

  httpServer.listen(ctx.appVariables.port, async () => {
    app.use(handleErrors);
    logger.info(ctx.appVariables.appName);
    logger.info(`server listening on port ${ctx.appVariables.port}`);
    startJobRunner(ctx).catch(error => consoleLogger.error(error));
  });
}

setup();

// TODO: move these error logs to mongo
process.on('uncaughtException', (exp: any, origin: any) => {
  consoleLogger.info('uncaughtException');
  consoleLogger.error(exp);
  consoleLogger.info(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  consoleLogger.info('unhandledRejection');
  consoleLogger.info(promise);
  consoleLogger.info(reason);
});
