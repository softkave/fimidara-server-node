import {
    CollaborationRequestEmailReason,
    ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
    CollaborationRequestExistsError,
    CollaboratorExistsError,
} from '../errors';
import {ISendRequestsContext, SendRequestsEndpoint} from './types';
import {sendRequestsJoiSchema} from './validation';
import {add} from 'date-fns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {collabRequestListExtractor} from '../utils';
import {IUser} from '../../../definitions/user';
import {indexArray} from '../../../utilities/indexArray';

interface ISendRequestEmailResult {
    request: ICollaborationRequest;
    successful: boolean;
    error?: any;
}

async function sendEmails(
    context: ISendRequestsContext,
    requests: ICollaborationRequest[],
    existingUsers: IUser[],
    organizationName: string
) {
    const existingUsersMap = indexArray(existingUsers, {
        indexer: next => next.email.toLowerCase(),
    });
    const sendEmailsResult = await Promise.all(
        requests.map(request => {
            return new Promise<ISendRequestEmailResult>(resolve => {
                context
                    .sendRequestEmail(
                        context,
                        request,
                        !!existingUsersMap[
                            request.recipientEmail.toLowerCase()
                        ],
                        organizationName
                    )
                    .then(() => {
                        resolve({
                            request,
                            successful: true,
                        });
                    })
                    .catch(error => {
                        console.error(error);
                        resolve({
                            request,
                            error,
                            successful: false,
                        });
                    });
            });
        })
    );

    sendEmailsResult.forEach(({request, successful}) => {
        if (!successful) {
            return;
        }

        const sentEmailHistory = (request.sentEmailHistory || []).concat({
            date: getDateString(),
            reason: CollaborationRequestEmailReason.RequestNotification,
        });

        fireAndForgetPromise(
            context.collaborationRequest.updateCollaborationRequestById(
                context,
                request.requestId,
                {
                    sentEmailHistory,
                }
            )
        );
    });
}

const sendRequests: SendRequestsEndpoint = async (context, instData) => {
    const data = validate(instData.data, sendRequestsJoiSchema);
    const user = await context.session.getUser(context, instData);
    const org = await context.organization.assertGetOrganizationById(
        context,
        data.organizationId
    );

    const recipientEmails = data.requests.map(req => req.recipientEmail);
    const existingUsers = await context.user.getUsersByEmail(
        context,
        recipientEmails
    );

    let errors = existingUsers
        .filter(existingUser => {
            return (
                existingUser.orgs.findIndex(
                    next => next.organizationId === org.organizationId
                ) !== -1
            );
        })
        .map(existingUser => {
            return new CollaboratorExistsError({
                email: existingUser.email,
            });
        });

    if (errors.length > 0) {
        throw errors;
    }

    const existingRequests = await context.collaborationRequest.getCollaborationRequestsByRecipientEmail(
        context,
        recipientEmails,
        org.organizationId
    );

    errors = existingRequests.map(existingRequest => {
        return new CollaborationRequestExistsError({
            email: existingRequest.recipientEmail,
        });
    });

    if (errors.length > 0) {
        throw errors;
    }

    const requests: ICollaborationRequest[] = data.requests.map(request => ({
        requestId: getNewId(),
        createdAt: getDateString(),
        createdBy: user.userId,
        message: request.message,
        organizationId: org.organizationId,
        organizationName: org.name,
        recipientEmail: request.recipientEmail,
        expiresAt: getDateString(
            add(new Date(), {
                seconds: request.expiresAt,
            })
        ),
        sentEmailHistory: [],
        statusHistory: [],
    }));

    const savedRequests = await context.collaborationRequest.bulkSaveCollaborationRequests(
        context,
        requests
    );

    fireAndForgetPromise(
        sendEmails(context, savedRequests, existingUsers, org.name)
    );

    return {
        requests: collabRequestListExtractor(savedRequests),
    };
};

export default sendRequests;
