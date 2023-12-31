import {expressjwt} from 'express-jwt';
import 'reflect-metadata';
import {endpointConstants} from './endpoints/constants';
import {kUtilsInjectables, registerInjectables} from './endpoints/contexts/injectables';
import {setupFimidaraHttpEndpoints} from './endpoints/endpoints';
import {startRunner} from './endpoints/jobs/runner';
import {setupApp} from './endpoints/runtime/initAppSetup';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {appAssert} from './utils/assertion';
import {serverLogger} from './utils/logger/loggerUtils';
import cors = require('cors');
import express = require('express');
import http = require('http');
import process = require('process');

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

function setupJWT() {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.jwtSecret);

  app.use(
    // TODO: do further research on JWT options, algorithms and best practices
    expressjwt({
      secret: suppliedConfig.jwtSecret,
      credentialsRequired: false,
      algorithms: ['HS256'],
    })
  );
}

async function setup() {
  registerInjectables();

  // Run scripts here
  // End of scripts

  const defaultWorkspace = await setupApp();
  serverLogger.info(`Default workspace ID - ${defaultWorkspace.resourceId}`);

  setupJWT();
  setupFimidaraHttpEndpoints(app);
  app.use(handleErrors);

  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.port);
  appAssert(suppliedConfig.appName);

  httpServer.listen(suppliedConfig.port, async () => {
    serverLogger.info(suppliedConfig.appName);
    serverLogger.info(process.env.NODE_ENV);
    serverLogger.info(`server listening on port ${suppliedConfig.port}`);

    // start job runner
    kUtilsInjectables.promiseStore().forget(startRunner());
  });
}

setup();

// TODO: move these error logs to mongo
process.on('uncaughtException', (exp, origin) => {
  serverLogger.info('uncaughtException');
  serverLogger.error(exp);
  serverLogger.info(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.info('unhandledRejection');
  serverLogger.info(promise);
  serverLogger.info(reason);
});
