import {fetch, Headers} from 'cross-fetch';

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

export const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';
export const HTTP_HEADER_AUTHORIZATION = 'Authorization';
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json';
export const CONTENT_TYPE_MULTIPART_FORMDATA = 'multipart/form-data';

export interface IInvokeEndpointParams {
  data?: any;
  path: string;
  headers?: Record<string, string>;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export async function invokeEndpoint<T extends any = any>(
  props: IInvokeEndpointParams
) {
  const {data, path, headers, method} = props;
  const incomingHeaders = {
    [HTTP_HEADER_CONTENT_TYPE]: CONTENT_TYPE_APPLICATION_JSON,
    ...headers,
  };

  let contentBody = data;

  if (typeof contentBody === 'object') {
    contentBody = {...data};
    delete contentBody.authToken;
    contentBody = JSON.stringify(contentBody);
  }

  const endpointAddr = serverAddr + path;
  const result = await fetch(endpointAddr, {
    method,
    headers: incomingHeaders,
    body: contentBody,
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

export interface IInvokeEndpointWithAuthParams extends IInvokeEndpointParams {
  token: string;
}

export async function invokeEndpointWithAuth<T extends any = any>(
  props: IInvokeEndpointWithAuthParams
) {
  const {token} = props;
  return invokeEndpoint<T>({
    ...props,
    headers: {
      [HTTP_HEADER_AUTHORIZATION]: `Bearer ${token}`,
      ...props.headers,
    },
  });
}

export class EndpointsBase extends FimidaraJsConfig {
  protected getAuthToken(params?: {authToken?: string}) {
    return params?.authToken || this.config.authToken;
  }
}
