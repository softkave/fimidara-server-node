import {getFooterHTML, getHeaderHTML, getHeaderText} from './helpers';

export interface ICollaborationRequestEmailProps {
    signupLink: string;
    loginLink: string;
    organizationName: string;
    isRecipientAUser: boolean;
    title: string;
}

export function collaborationRequestEmailHTML(
    props: ICollaborationRequestEmailProps
) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${getHeaderText(props.title)}</title>
        <style>
        </style>
    </head>
    <body>
        ${getHeaderHTML(props.title)}
        <p>
            You have a new collaboration request from <b>${
                props.organizationName
            }</b>.
        </p>
        <p>
            To respond to this request,
            ${
                props.isRecipientAUser
                    ? `<a href="${props.loginLink}">Login to your account here</a>`
                    : `<a href="${props.signupLink}">Signup here</a>`
            }
        </p>
        ${getFooterHTML()}
    </body>

    </html>
    `;
}

export function collaborationRequestEmailText(
    props: ICollaborationRequestEmailProps
) {
    function getLink() {
        return props.isRecipientAUser
            ? `
            Login to your account here - 
            ${props.loginLink}
            `
            : `
            Create an account here - 
            ${props.signupLink}
            `;
    }

    const txt = `
    ${getHeaderText(props.title)}

    You have a new collaboration request from ${props.organizationName}

    To respond to this request, ${getLink()}
    `;

    return txt;
}
