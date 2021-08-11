import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {getForgotPasswordContext} from './forgotPassword/context';
import forgotPassword from './forgotPassword/forgotPassword';
import getUserData from './getUserData/getUserData';
import login from './login/login';
import signup from './signup/signup';
import updateUser from './updateUser/handler';
import userExists from './userExists/handler';
import {Express} from 'express';
import {getSignupContext} from './signup/context';
import confirmEmailAddress from './confirmEmailAddress/handler';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler';
import {getSendEmailVerificationCodeContext} from './sendEmailVerificationCode/context';
import {getChangePasswordWithCurrentPasswordContext} from './changePasswordWithCurrentPassword/context';
import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler';
import changePasswordWithToken from './changePasswordWithToken/changePasswordWithToken';
import {getChangePasswordWithTokenContext} from './changePasswordWithToken/context';
import {getUpdateUserEndpointContext} from './updateUser/context';

export default function setupAccountRESTEndpoints(
    connection: Connection,
    app: Express
) {
    const account = {
        signup: wrapEndpointREST(signup, getSignupContext(connection)),
        login: wrapEndpointREST(login, getBaseContext(connection)),
        forgotPassword: wrapEndpointREST(
            forgotPassword,
            getForgotPasswordContext(connection)
        ),
        changePasswordWithCurrentPassword: wrapEndpointREST(
            changePasswordWithCurrentPassword,
            getChangePasswordWithCurrentPasswordContext(connection)
        ),
        changePasswordWithToken: wrapEndpointREST(
            changePasswordWithToken,
            getChangePasswordWithTokenContext(connection)
        ),
        updateUser: wrapEndpointREST(
            updateUser,
            getUpdateUserEndpointContext(connection)
        ),
        getUserData: wrapEndpointREST(getUserData, getBaseContext(connection)),
        userExists: wrapEndpointREST(userExists, getBaseContext(connection)),
        confirmEmailAddress: wrapEndpointREST(
            confirmEmailAddress,
            getBaseContext(connection)
        ),
        sendEmailVerificationCode: wrapEndpointREST(
            sendEmailVerificationCode,
            getSendEmailVerificationCodeContext(connection)
        ),
    };

    app.post('/user/signup', account.signup);
    app.post('/user/login', account.login);
    app.post('/user/forgotPassword', account.forgotPassword);
    app.post(
        '/user/changePasswordWithCurrentPassword',
        account.changePasswordWithCurrentPassword
    );
    app.post('/user/changePasswordWithToken', account.changePasswordWithToken);
    app.post('/user/updateUser', account.updateUser);
    app.post('/user/getUserData', account.getUserData);
    app.post('/user/userExists', account.userExists);
    app.post('/user/confirmEmailAddress', account.confirmEmailAddress);
    app.post(
        '/user/sendEmailVerificationCode',
        account.sendEmailVerificationCode
    );
}
