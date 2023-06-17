import cors = require('cors');
import express = require('express');
import http = require('http');
import {expressjwt} from 'express-jwt';
import {getMongoConnection} from './db/connection';
import {endpointConstants} from './endpoints/constants';
import BaseContext, {getEmailProvider, getFileProvider} from './endpoints/contexts/BaseContext';
import {BaseContextType} from './endpoints/contexts/types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from './endpoints/contexts/utils';
import {setupFimidaraHttpEndpoints} from './endpoints/endpoints';
import {startJobRunner} from './endpoints/jobs/runner';
import {setupApp} from './endpoints/runtime/initAppSetup';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {fimidaraConfig} from './resources/vars';
import {serverLogger} from './utils/logger/loggerUtils';

serverLogger.info('server initialization');

const app = express();
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

function setupJWT(ctx: BaseContextType) {
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
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );

  // Run scripts here
  // End of scripts

  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    getDataProviders(models),
    getEmailProvider(fimidaraConfig),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );
  await ingestDataIntoMemStore(ctx);

  const defaultWorkspace = await setupApp(ctx);
  serverLogger.info(`Default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT(ctx);
  setupFimidaraHttpEndpoints(ctx, app);

  httpServer.listen(ctx.appVariables.port, async () => {
    app.use(handleErrors);
    serverLogger.info(ctx.appVariables.appName);
    serverLogger.info(ctx.appVariables.nodeEnv);
    serverLogger.info(`server listening on port ${ctx.appVariables.port}`);

    // start job runner
    startJobRunner(ctx).catch(error => serverLogger.error(error));
  });
}

setup();

// TODO: move these error logs to mongo
process.on('uncaughtException', (exp: any, origin: any) => {
  serverLogger.info('uncaughtException');
  serverLogger.error(exp);
  serverLogger.info(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.info('unhandledRejection');
  serverLogger.info(promise);
  serverLogger.info(reason);
});
