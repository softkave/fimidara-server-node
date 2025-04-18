import {expressjwt} from 'express-jwt';
import fs from 'fs';
import helmet from 'helmet';
import {format} from 'util';
import {globalDispose, globalSetup} from './contexts/globalUtils.js';
import {kIjxUtils} from './contexts/ijx/injectables.js';
import {kEndpointConstants} from './endpoints/constants.js';
import {setupFimidaraHttpEndpoints} from './endpoints/endpoints.js';
import {initFimidara} from './endpoints/runtime/initFimidara.js';
import {handleErrors, handleNotFound} from './middlewares/handleErrors.js';
import redirectHttpToHttpsExpressMiddleware from './middlewares/redirectHttpToHttps.js';
import {appAssert} from './utils/assertion.js';
import cors = require('cors');
import express = require('express');
import http = require('http');
import https = require('https');
import process = require('process');

interface RuntimeArtifacts {
  httpServer?: http.Server;
  httpsServer?: https.Server;
}

const app = express();
const artifacts: RuntimeArtifacts = {};

const corsOption: cors.CorsOptions = {
  // match all origins
  origin: true,
  optionsSuccessStatus: kEndpointConstants.httpStatusCode.ok,
  credentials: true,
};

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);
app.disable('x-powered-by');
app.use(cors(corsOption));
app.use(express.json() as express.RequestHandler);

async function setupHttpServer() {
  const conf = kIjxUtils.suppliedConfig();
  let httpServerPromise: Promise<void> | undefined;
  let httpsServerPromise: Promise<void> | undefined;

  if (conf.exposeHttpServer) {
    appAssert(conf.httpPort, 'httpPort not present in config');

    const httpServer = http.createServer(app);
    artifacts.httpServer = httpServer;
    httpServerPromise = new Promise(resolve => {
      httpServer.listen(conf.httpPort, () => {
        kIjxUtils.logger().log(`HTTP port: ${conf.httpPort}`);
        resolve();
      });
    });
  }

  if (conf.exposeHttpsServer) {
    if (!conf.exposeHttpServer) {
      app.use(redirectHttpToHttpsExpressMiddleware);
    }

    appAssert(
      conf.httpsPublicKeyFilepath,
      'httpsPublicKeyFilepath not present in config'
    );
    appAssert(
      conf.httpsPrivateKeyFilepath,
      'httpsPrivateKeyFilepath not present in config'
    );
    appAssert(conf.httpsPort, 'httpsPort not present in config');

    const privateKey = fs.readFileSync(conf.httpsPrivateKeyFilepath, 'utf8');
    const certificate = fs.readFileSync(conf.httpsPublicKeyFilepath, 'utf8');
    const credentials = {key: privateKey, cert: certificate};
    const httpsServer = https.createServer(credentials, app);
    artifacts.httpsServer = httpsServer;
    httpsServerPromise = new Promise(resolve => {
      httpsServer.listen(conf.httpsPort, () => {
        kIjxUtils.logger().log(`HTTPS port: ${conf.httpsPort}`);
        resolve();
      });
    });
  }

  await Promise.all([httpServerPromise, httpsServerPromise]);
}

function setupJWT() {
  const suppliedConfig = kIjxUtils.suppliedConfig();
  appAssert(suppliedConfig.jwtSecret, 'jwtSecret not present in config');

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
  await globalSetup(
    /** overrideConfig */ {},
    {
      useHandleFolderQueue: true,
      useHandleUsageRecordQueue: true,
      useHandleAddInternalMultipartIdQueue: true,
      useHandlePrepareFileQueue: true,
    }
  );
  kIjxUtils.logger().log('Server initialization');

  // Run scripts here
  // End of scripts

  const defaultWorkspace = await initFimidara();
  kIjxUtils.logger().log(`Workspace ID: ${defaultWorkspace.resourceId}`);

  setupJWT();
  setupFimidaraHttpEndpoints(app);

  await setupHttpServer();

  app.use(handleNotFound);
  app.use(handleErrors);
}

// TODO: run global dispose on close/end server
setup();

async function closeHttpServer(server: http.Server): Promise<void> {
  const addr = server.address();
  return new Promise(resolve => {
    server.close(error => {
      if (error) {
        kIjxUtils.logger().error(error);
      }

      kIjxUtils.logger().log(`Closed ${format(addr)}`);
      resolve();
    });

    server.closeAllConnections();
  });
}

async function endServer() {
  kIjxUtils.runtimeState().setIsEnded(true);
  kIjxUtils.logger().log('Started graceful shutdown');
  await Promise.allSettled([
    artifacts.httpServer && closeHttpServer(artifacts.httpServer),
    artifacts.httpsServer && closeHttpServer(artifacts.httpsServer),
  ]);

  kIjxUtils.logger().log('Started app dispose');
  await globalDispose();

  // eslint-disable-next-line no-process-exit
  process.exit();
}

process.on('uncaughtException', (exp, origin) => {
  kIjxUtils.logger().log('uncaughtException');
  kIjxUtils.logger().error(exp);
  kIjxUtils.logger().log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  kIjxUtils.logger().log('unhandledRejection');
  kIjxUtils.logger().log(promise);
  kIjxUtils.logger().log(reason);
});

process.on('SIGINT', endServer);
process.on('SIGTERM', endServer);
