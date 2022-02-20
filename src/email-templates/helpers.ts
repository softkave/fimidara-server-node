import {defaultStaticVars} from '../resources/appVariables';

const maxWidth = '500px';
const classNamePrefix = 'fbs'; // files by softkave
export const emailTemplateConstants = {
  maxWidth,
  classNamePrefix,
};

export const emailTemplateStyles = `
<style>
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

export function getFooterHTML() {
  return `
    <footer class="email-footer">
        &copy; ${defaultStaticVars.appName} ${new Date().getFullYear()}
    </footer>
    `;
}

export function getHeaderHTML(title: string) {
  return `
    <header class="email-header email-content-center">
        <h1>${defaultStaticVars.appName} | ${title}</h1>
    </header>
    `;
}

export function getHeaderText(title: string) {
  return `${defaultStaticVars.appName} | ${title}`;
}
