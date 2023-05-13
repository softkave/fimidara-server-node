import {defaultStaticVars} from '../resources/vars';
import {BaseEmailTemplateProps} from './types';

export const emailHelperChars = {emDash: '—'};

const maxWidth = '700px';
const classNamePrefix = 'fimidara';
export const emailStylingHelpers = {
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
body, div, p, h1, h2, h3, h4, h5, span {
  font-family: arial, sans-serif;
  font-size: 14px;
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
  ${withDonotReply ? 'Auto-generated email, do not reply. <br />' : ''}
  &copy; - ${defaultStaticVars.appName} - ${new Date().getFullYear()}
</footer>
    `;
}

export function getHeaderHTML(title: string) {
  return `
<header class="${classNamePrefix}-header ${classNamePrefix}-content-center">
  <h1>${defaultStaticVars.appName} ${emailHelperChars.emDash} <br /> ${title}</h1>
</header>
    `;
}

export function getCenteredContentHTML(content: string) {
  return `
<div class="${emailStylingHelpers.classNamePrefix}-body">
  <div class="${emailStylingHelpers.classNamePrefix}-content-center">
    ${content}
  </div>
</div>
    `;
}

export function getDoNotReplyHTML() {
  return getCenteredContentHTML('This is an auto-generated email, do not reply.');
}

export function getAccountAccessSectionHTML(props: BaseEmailTemplateProps) {
  return `
<div class="${emailStylingHelpers.classNamePrefix}-body">
  <div class="${emailStylingHelpers.classNamePrefix}-content-center">
    <a href="${props.loginLink}">Login to fimidara here</a> - OR -<br />
    <a href="${props.signupLink}">Signup on fimidara here</a>
  </div>
</div>
    `;
}

export function getAccountAccessSectionText(props: BaseEmailTemplateProps) {
  return `${emailHelperChars.emDash}
Login to fimidara here ${emailHelperChars.emDash} ${props.loginLink} ${emailHelperChars.emDash} OR ${emailHelperChars.emDash}
Signup on fimidara here ${emailHelperChars.emDash} ${props.signupLink}
`;
}

export function getLoginSectionHTML(props: Pick<BaseEmailTemplateProps, 'loginLink'>) {
  return `
<div class="${emailStylingHelpers.classNamePrefix}-body">
  <div class="${emailStylingHelpers.classNamePrefix}-content-center">
    <a href="${props.loginLink}">Login to your account here</a>
  </div>
</div>
    `;
}

export function getLoginSectionText(props: Pick<BaseEmailTemplateProps, 'loginLink'>) {
  return `—
Login to your account here ${emailHelperChars.emDash} ${props.loginLink}\n
`;
}

export function getHeaderText(title: string) {
  return `${defaultStaticVars.appName} ${emailHelperChars.emDash} ${title}`;
}

export function getGreetingHTML(props: {firstName?: string}) {
  return props.firstName ? `<p>Hi ${props.firstName},</p>` : '';
}

export function getGreetingText(props: {firstName?: string}) {
  return props.firstName ? `Hi ${props.firstName},` : '';
}
