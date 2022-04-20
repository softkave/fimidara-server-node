import {defaultStaticVars} from '../resources/appVariables';
import {IBaseEmailTemplateProps} from './types';

const maxWidth = '700px';
const classNamePrefix = 'fimidara';
export const emailTemplateConstants = {
  maxWidth,
  classNamePrefix,
};

export const emailTemplateFonts = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans&display=swap" rel="stylesheet">
`;

export const emailTemplateStyles = `
<style>
body {
  font-family: arial;
}

.${classNamePrefix}-header {
  text-align: left;
}

.${classNamePrefix}-header h1 {
  font-size: 16px;
}

.${classNamePrefix}-body {
  margin-top: 32px;
  margin-bottom: 32px;
}

.${classNamePrefix}-content-center {
  max-width: ${maxWidth};
  padding-left: 16px;
  padding-right: 16px;
  margin: auto;
}

.${classNamePrefix}-footer {
  max-width: ${maxWidth};
  margin: auto
}
</style>
`;

export function getFooterHTML(withDonotReply = true): string {
  return `
<footer class="${classNamePrefix}-footer ${classNamePrefix}-content-center">
  ${withDonotReply ? `Auto-generated email, do not reply. <br />` : ''}
  &copy; - ${defaultStaticVars.appName} - ${new Date().getFullYear()}
</footer>
    `;
}

export function getHeaderHTML(title: string) {
  return `
<header class="${classNamePrefix}-header ${classNamePrefix}-content-center">
  <h1>${defaultStaticVars.appName} - <br /> ${title}</h1>
</header>
    `;
}

export function getCenteredContentHTML(content: string) {
  return `
<div class="${emailTemplateConstants.classNamePrefix}-body">
  <div class="${emailTemplateConstants.classNamePrefix}-content-center">
    ${content}
  </div>
</div>
    `;
}

export function getDoNotReplyHTML() {
  return getCenteredContentHTML(
    'This is an auto-generated email, do not reply.'
  );
}

export function getLoginSectionHTML(props: IBaseEmailTemplateProps) {
  return `
<div class="${emailTemplateConstants.classNamePrefix}-body">
  <div class="${emailTemplateConstants.classNamePrefix}-content-center">
    <a href="${props.loginLink}">Login to your account here</a> - OR -<br />
    <a href="${props.signupLink}">Signup here</a>
  </div>
</div>
    `;
}

export function getLoginSectionText(props: IBaseEmailTemplateProps) {
  return `-
Login to your account here - ${props.loginLink} - OR -
Signup here - ${props.signupLink}
`;
}

export function getHeaderText(title: string) {
  return `${defaultStaticVars.appName} - ${title}`;
}
