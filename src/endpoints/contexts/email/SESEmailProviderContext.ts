import {
  GetMessageInsightsCommand,
  SendEmailCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2';
import {kEmailBlocklistReason} from '../../../definitions/email';
import {kFimidaraConfigEmailProvider} from '../../../resources/config';
import {appAssert} from '../../../utils/assertion';
import {S3FilePersistenceProviderInitParams} from '../file/S3FilePersistenceProvider';
import {kUtilsInjectables} from '../injection/injectables';
import {
  EmailProviderBlockEmailAddressItem,
  EmailProviderSendEmailResult,
  IEmailProviderContext,
  SendEmailParams,
} from './types';

export class SESEmailProviderContext implements IEmailProviderContext {
  protected ses: SESv2Client;

  constructor(params: S3FilePersistenceProviderInitParams) {
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    appAssert(
      suppliedConfig.awsConfigs?.sesEmailEncoding,
      'No sesEmailEncoding set in awsConfigs'
    );

    this.ses = new SESv2Client({
      region: params.region,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
    });
  }

  sendEmail = async (
    params: SendEmailParams
  ): Promise<EmailProviderSendEmailResult | undefined> => {
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    const sesEmailEncoding = suppliedConfig.awsConfigs?.sesEmailEncoding;
    appAssert(sesEmailEncoding, 'No sesEmailEncoding set in awsConfigs');

    const command = new SendEmailCommand({
      Destination: {ToAddresses: params.destination},
      FromEmailAddress: params.source,
      Content: {
        Simple: {
          Subject: {Charset: sesEmailEncoding, Data: params.subject},
          Body: {
            Html: {Charset: sesEmailEncoding, Data: params.body.html},
            Text: {Charset: sesEmailEncoding, Data: params.body.text},
          },
        },
      },
    });

    const result = await this.ses.send(command);

    if (result.MessageId) {
      return await this.tryGetMessageInsights(result.MessageId);
    }

    return undefined;
  };

  dispose = async () => {
    await this.ses.destroy();
  };

  protected async tryGetMessageInsights(
    messageId: string
  ): Promise<EmailProviderSendEmailResult> {
    try {
      // TODO: throttle GetMessageInsightsCommand, check SES doc
      const command = new GetMessageInsightsCommand({MessageId: messageId});
      const insightsResult = await this.ses.send(command);

      // TODO: also handle complaints (spam), and other insights
      const blockEmailAddressList: EmailProviderBlockEmailAddressItem[] = [];
      insightsResult.Insights?.forEach(insight => {
        const emailBounced = insight.Events?.some(event => event.Type === 'BOUNCE');

        if (emailBounced && insight.Destination) {
          blockEmailAddressList.push({
            emailAddress: insight.Destination,
            reason: kEmailBlocklistReason.bounce,
          });
        }
      });

      return {
        blockEmailAddressList,
        meta: {emailProvider: kFimidaraConfigEmailProvider.ses, other: insightsResult},
      };
    } catch (error) {
      kUtilsInjectables.logger().error(error);
      return {};
    }
  }
}
