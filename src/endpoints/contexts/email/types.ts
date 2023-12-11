export interface SendEmailParams {
  destination: string[];
  source: string;
  subject: string;
  body: {
    html: string;
    text: string;
  };
}

export interface IEmailProviderContext {
  sendEmail: (params: SendEmailParams) => Promise<void>;
  close: () => void | Promise<void>;
}
