import {fetch, Headers} from 'cross-fetch';
import * as FormData from 'isomorphic-form-data';

type EndpointErrorItem = {
  name: string;
  message: string;
  field?: string;
};

export class FimidaraEndpointError extends Error {
  constructor(
    public errors: Array<EndpointErrorItem>,
    public statusCode: number,
    public statusText: string,
    public headers: typeof Headers
  ) {
    super('Fimidara endpoint error.');
  }
}

export interface FimidaraJsConfigOptions {
  authToken?: string;
}

export class FimidaraJsConfig {
  constructor(
    protected config: FimidaraJsConfigOptions &
      Required<Pick<FimidaraJsConfigOptions, 'authToken'>>
  ) {}

  setAuthToken(token: string) {
    this.config.authToken = token;
  }

  setConfig(params: Partial<FimidaraJsConfig>) {
    this.config = {...this.config, ...params};
  }

  getConfig() {
    return this.config;
  }
}

const serverAddr =
  (process ? process.env.FIMIDARA_SERVER_ADDR : undefined) ??
  'https://api.fimidara.com';

const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';
const HTTP_HEADER_AUTHORIZATION = 'Authorization';
const CONTENT_TYPE_APPLICATION_JSON = 'application/json';

export interface IInvokeEndpointParams {
  token?: string;
  data?: any;
  formdata?: any;
  path: string;
  headers?: Record<string, string>;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export async function invokeEndpoint(props: IInvokeEndpointParams) {
  const {data, path, headers, method, token, formdata} = props;
  const incomingHeaders = {...headers};
  let contentBody = undefined;

  if (formdata) {
    const contentFormdata = new FormData();
    for (const key in formdata) {
      contentFormdata.append(key, formdata[key]);
    }
    contentBody = contentFormdata;
  } else if (data) {
    contentBody = JSON.stringify(data);
    incomingHeaders[HTTP_HEADER_CONTENT_TYPE] = CONTENT_TYPE_APPLICATION_JSON;
  }

  if (token) {
    incomingHeaders[HTTP_HEADER_AUTHORIZATION] = `Bearer ${token}`;
  }

  const endpointAddr = serverAddr + path;
  const result = await fetch(endpointAddr, {
    method,
    headers: incomingHeaders,
    body: contentBody as any,
    mode: 'cors',
  });

  if (result.ok) {
    return result;
  }

  const isResultJSON = result.headers
    .get(HTTP_HEADER_CONTENT_TYPE)
    ?.includes(CONTENT_TYPE_APPLICATION_JSON);

  let errors: EndpointErrorItem[] = [];
  if (isResultJSON) {
    const body = (await result.json()) as
      | {errors: EndpointErrorItem[]}
      | undefined;

    if (body?.errors) {
      errors = body.errors;
    }
  }

  throw new FimidaraEndpointError(
    errors,
    result.status,
    result.statusText,
    result.headers as any
  );
}

export class EndpointsBase extends FimidaraJsConfig {
  protected getAuthToken(params?: {authToken?: string}) {
    return params?.authToken || this.config.authToken;
  }
}
