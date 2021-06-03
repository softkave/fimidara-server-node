import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import changePassword from './changePassword/changePassword';
import changePasswordWithToken from './changePasswordWithToken/changePasswordWithToken';
import {getChangePasswordWithTokenContext} from './changePasswordWithToken/context';
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
import confirmPhoneNumber from './confirmPhoneNumber/handler';
import {getConfirmPhoneNumberContext} from './confirmPhoneNumber/context';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler';
import {getSendEmailVerificationCodeContext} from './sendEmailVerificationCode/context';
import sendPhoneVerificationCode from './sendPhoneVerificationCode/handler';
import {getSendPhoneVerificationCodeContext} from './sendPhoneVerificationCode/context';

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
        changePassword: wrapEndpointREST(
            changePassword,
            getBaseContext(connection)
        ),
        changePasswordWithToken: wrapEndpointREST(
            changePasswordWithToken,
            getChangePasswordWithTokenContext(connection)
        ),
        updateUser: wrapEndpointREST(updateUser, getBaseContext(connection)),
        getUserData: wrapEndpointREST(getUserData, getBaseContext(connection)),
        userExists: wrapEndpointREST(userExists, getBaseContext(connection)),
        confirmEmailAddress: wrapEndpointREST(
            confirmEmailAddress,
            getBaseContext(connection)
        ),
        confirmPhoneNumber: wrapEndpointREST(
            confirmPhoneNumber,
            getConfirmPhoneNumberContext(connection)
        ),
        sendEmailVerificationCode: wrapEndpointREST(
            sendEmailVerificationCode,
            getSendEmailVerificationCodeContext(connection)
        ),
        sendPhoneVerificationCode: wrapEndpointREST(
            sendPhoneVerificationCode,
            getSendPhoneVerificationCodeContext(connection)
        ),
    };

    app.post('/account/signup', account.signup);
    app.post('/account/login', account.login);
    app.post('/account/forgotPassword', account.forgotPassword);
    app.post('/account/changePassword', account.changePassword);
    app.post(
        '/account/changePasswordWithToken',
        account.changePasswordWithToken
    );
    app.post('/account/updateUser', account.updateUser);
    app.post('/account/getUserData', account.getUserData);
    app.post('/account/userExists', account.userExists);
    app.post('/account/confirmEmailAddress', account.confirmEmailAddress);
    app.post('/account/confirmPhoneNumber', account.confirmPhoneNumber);
    app.post(
        '/account/sendEmailVerificationCode',
        account.sendEmailVerificationCode
    );
    app.post(
        '/account/sendPhoneVerificationCode',
        account.sendPhoneVerificationCode
    );
}
