import {ValueOf} from 'type-fest';

export interface BaseEmailTemplateProps {
  signupLink: string;
  loginLink: string;
  firstName?: string;
}

export const kEmailModes = {
  html: 'html',
  text: 'text',
} as const;

export type EmailMode = ValueOf<typeof kEmailModes>;
