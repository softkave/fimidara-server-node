import {appVariables} from '../resources/appVariables';

export function getFooterHTML() {
  return `
    <footer class="email-footer">
        <hr>
        &copy; ${appVariables.appName} ${new Date().getFullYear()}
    </footer>
    `;
}

export function getHeaderHTML(title: string) {
  return `
    <header class="email-header email-content-center">
        <h1>${appVariables.appName} | ${title}</h1>
        <hr>
    </header>
    `;
}

export function getHeaderText(title: string) {
  return `${appVariables.appName} | ${title}`;
}

const maxWidth = 500;

export function getTemplateCSS() {
  return `
    .email-header {
        text-align: left;
    }

    .email-header h1 {
        font-size: 16px;
    }

    .email-body {
        margin-top: 32px;
        margin-bottom: 32px;
    }

    .email-content-center {
        max-width: ${maxWidth}px;
        padding-left: 16px;
        padding-right: 16px;
        margin: auto;
    }

    .email-footer {
        max-width: ${maxWidth}px;
        margin: auto
    }
    `;
}
