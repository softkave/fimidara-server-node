import cors = require('cors');
import express = require('express');
import expressJwt = require('express-jwt');
import http = require('http');
import multer = require('multer');
import {getMongoConnection} from './db/connection';
import setupClientAssignedTokensRESTEndpoints from './endpoints/clientAssignedTokens/setupRESTEndpoints';
import setupCollaborationRequestsRESTEndpoints from './endpoints/collaborationRequests/setupRESTEndpoints';
import setupCollaboratorsRESTEndpoints from './endpoints/collaborators/setupRESTEndpoints';
import {endpointConstants} from './endpoints/constants';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getFileProvider,
  getLogicProviders,
} from './endpoints/contexts/BaseContext';
import {SESEmailProviderContext} from './endpoints/contexts/EmailProviderContext';
import MongoDBDataProviderContext from './endpoints/contexts/MongoDBDataProviderContext';
import {IBaseContext} from './endpoints/contexts/types';
import {fileConstants} from './endpoints/files/constants';
import setupFilesRESTEndpoints from './endpoints/files/setupRESTEndpoints';
import setupFoldersRESTEndpoints from './endpoints/folders/setupRESTEndpoints';
import setupPermissionGroupsRESTEndpoints from './endpoints/permissionGroups/setupRESTEndpoints';
import setupPermissionItemsRESTEndpoints from './endpoints/permissionItems/setupRESTEndpoints';
import setupProgramAccessTokensRESTEndpoints from './endpoints/programAccessTokens/setupRESTEndpoints';
import setupResourcesRESTEndpoints from './endpoints/resources/setupRESTEndpoints';
import {setupApp} from './endpoints/runtime/initAppSetup';
import setupTagsRESTEndpoints from './endpoints/tags/setupRESTEndpoints';
import setupUsageRecordsRESTEndpoints from './endpoints/usageRecords/setupRESTEndpoints';
import setupAccountRESTEndpoints from './endpoints/user/setupRESTEndpoints';
import setupWorkspacesRESTEndpoints from './endpoints/workspaces/setupRESTEndpoints';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {extractProdEnvsSchema, getAppVariables} from './resources/vars';
import {script_AddThresholdToExistingWorkspaces} from './scripts/addThresholdToExistingWorkspaces';
import {consoleLogger, logger} from './utilities/logger/logger';

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

function setupJWT(ctx: IBaseContext) {
  app.use(
    // TODO: do further research on JWT options, algorithms and best practices
    expressJwt({
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
  await script_AddThresholdToExistingWorkspaces(connection);
  // End of scripts

  // Jobs
  // startJobs();
  // End of jobs

  const mongoDBDataProvider = new MongoDBDataProviderContext(connection);
  const emailProvider = new SESEmailProviderContext(appVariables.awsRegion);
  const ctx = new BaseContext(
    mongoDBDataProvider,
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders(),
    () => connection.close()
  );

  const defaultWorkspace = await setupApp(ctx);
  ctx.logger.info(`Default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT(ctx);
  setupClientAssignedTokensRESTEndpoints(ctx, app);
  setupCollaborationRequestsRESTEndpoints(ctx, app);
  setupCollaboratorsRESTEndpoints(ctx, app);
  setupFilesRESTEndpoints(ctx, app, upload);
  setupFoldersRESTEndpoints(ctx, app);
  setupWorkspacesRESTEndpoints(ctx, app);
  setupPermissionItemsRESTEndpoints(ctx, app);
  setupPermissionGroupsRESTEndpoints(ctx, app);
  setupProgramAccessTokensRESTEndpoints(ctx, app);
  setupAccountRESTEndpoints(ctx, app);
  setupResourcesRESTEndpoints(ctx, app);
  setupTagsRESTEndpoints(ctx, app);
  setupUsageRecordsRESTEndpoints(ctx, app);

  httpServer.listen(ctx.appVariables.port, async () => {
    app.use(handleErrors);
    logger.info(ctx.appVariables.appName);
    logger.info(`server listening on port ${ctx.appVariables.port}`);
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
