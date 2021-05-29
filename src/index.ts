import * as cors from 'cors';
import * as express from 'express';
import * as expressJwt from 'express-jwt';
import * as http from 'http';
import handleErrors from './middlewares/handleErrors';
import httpToHttps from './middlewares/httpToHttps';
import {getMongoConnection} from './db/connection';
import {getBaseContext, IBaseContext} from './endpoints/BaseContext';
import setupAccountRESTEndpoints from './endpoints/account/setupRESTEndpoints';
import setupShopRESTEndpoints from './endpoints/shops/setupRESTEndpoints';
import setupAppointmentRESTEndpoints from './endpoints/appointments/setupRESTEndpoints';
import {appVariables} from './resources/appVariables';

console.log('server initialization');

const app = express();
const httpServer = http.createServer(app);

// TODO: Define better white-listed CORS origins. Maybe from a DB.
// TODO: this will have to accept all requests
const whiteListedCorsOrigins = [/^https?:\/\/www.softkave.com$/];

if (process.env.NODE_ENV !== 'production') {
    whiteListedCorsOrigins.push(/localhost/);
}

const corsOption: cors.CorsOptions = {
    origin: whiteListedCorsOrigins,
    optionsSuccessStatus: 200,
    credentials: true,
};

if (process.env.NODE_ENV === 'production') {
    app.use(httpToHttps);
}

app.use(cors(corsOption));
app.use(
    express.json({
        type: 'application/json',
    })
);

function setupJWT(ctx: IBaseContext) {
    app.use(
        // TODO: do further research on options
        expressJwt({
            secret: ctx.appVariables.jwtSecret,
            credentialsRequired: false,
            algorithms: ['HS256'], // TODO: do further research
        })
    );
}

async function setupConnection() {
    const connection = await getMongoConnection();
    return connection;
}

async function setup() {
    const connection = await setupConnection();
    const ctx = getBaseContext(connection);

    setupJWT(ctx);
    setupAccountRESTEndpoints(connection, app);
    setupShopRESTEndpoints(connection, app);
    setupAppointmentRESTEndpoints(connection, app);

    httpServer.listen(appVariables.port, async () => {
        app.use(handleErrors);

        console.log(ctx.appVariables.appName);
        console.log(`Server listening on port ${ctx.appVariables.port}`);
    });
}

setup();

process.on('uncaughtException', (exp: any, origin: any) => {
    console.log('uncaughtException');
    console.error(exp);
    console.log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandledRejection');
    console.log(promise);
    console.log(reason);
});
