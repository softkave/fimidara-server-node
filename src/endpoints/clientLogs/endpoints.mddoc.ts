import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import clientLogsConstants from './constants';
import {ClientLog, IngestLogsEndpointParams} from './ingestLogs/types';
import {IngestLogsHttpEndpoint} from './types';

const clientLogInput = mddocConstruct
  .constructFieldObject<ClientLog>()
  .setName('ClientLogInput')
  .setFields({
    timestamp: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    level: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldString().setDescription('Log level')
    ),
    message: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldString().setDescription('Log message')
    ),
    service: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldString().setDescription('Fimidara service')
    ),
    stack: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct.constructFieldString().setDescription('Error log stack')
    ),
  });

const ingestLogsParams = mddocConstruct
  .constructFieldObject<IngestLogsEndpointParams>()
  .setName('IngestLogsEndpointParams')
  .setFields({
    logs: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<ClientLog>().setType(clientLogInput)
    ),
  });

export const ingestLogsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<IngestLogsHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<IngestLogsHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<IngestLogsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      IngestLogsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      IngestLogsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<IngestLogsHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(clientLogsConstants.routes.ingestLogs)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(ingestLogsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('IngestLogsEndpoint');
