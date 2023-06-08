import {
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {HttpEndpointRequestHeaders_AuthRequired_ContentType} from '../types';
import clientLogsConstants from './constants';
import {ClientLog, IngestLogsEndpointParams} from './ingestLogs/types';

const clientLogInput = FieldObject.construct<ClientLog>()
  .setName('ClientLogInput')
  .setFields({
    timestamp: FieldObject.requiredField(fReusables.date),
    level: FieldObject.requiredField(FieldString.construct().setDescription('Log level.')),
    message: FieldObject.requiredField(FieldString.construct().setDescription('Log message.')),
    service: FieldObject.requiredField(FieldString.construct().setDescription('Fimidara service.')),
    stack: FieldObject.optionalField(FieldString.construct().setDescription('Error log stack.')),
  });

const ingestLogsParams = FieldObject.construct<IngestLogsEndpointParams>()
  .setName('IngestLogsEndpointParams')
  .setFields({
    logs: FieldObject.requiredField(FieldArray.construct<ClientLog>().setType(clientLogInput)),
  })
  .setRequired(true);

export const ingestLogsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: IngestLogsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
}>()
  .setBasePathname(clientLogsConstants.routes.ingestLogs)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(ingestLogsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setName('IngestLogsEndpoint');
