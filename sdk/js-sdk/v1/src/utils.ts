import {fetch, Headers} from 'cross-fetch';
import FormData from 'isomorphic-form-data';

const defaultServerURL =
  (process ? process.env.FIMIDARA_SERVER_URL : undefined) ??
  'https://api.fimidara.com';

type FimidaraEndpointErrorItem = {
  name: string;
  message: string;
  field?: string;

  // TODO: find a way to include in generated doc for when we add new
  // recommended actions
  action?: 'logout' | 'loginAgain' | 'requestChangePassword';
};

export class FimidaraEndpointError extends Error {
  name = 'FimidaraEndpointError';

  constructor(
    public errors: Array<FimidaraEndpointErrorItem>,
    public statusCode: number,
    public statusText: string,
    public headers: typeof Headers
  ) {
    super('Fimidara endpoint error.');
  }
}

export interface FimidaraJsConfigOptions {
  authToken?: string;
  serverURL?: string;
}

export class FimidaraJsConfig {
  protected inheritors: FimidaraJsConfig[] = [];

  constructor(
    protected config: FimidaraJsConfigOptions = {},
    protected inheritConfigFrom?: FimidaraJsConfig
  ) {
    inheritConfigFrom?.registerInheritor(this);
  }

  setAuthToken(token: string) {
    this.setConfig({authToken: token});
  }

  setConfig(update: Partial<FimidaraJsConfigOptions>) {
    this.config = {...this.config, ...update};
    this.fanoutConfigUpdate(update);
  }

  getConfig() {
    return this.config;
  }

  protected registerInheritor(inheritor: FimidaraJsConfig) {
    this.inheritors.push(inheritor);
  }

  protected fanoutConfigUpdate(update: Partial<FimidaraJsConfigOptions>) {
    this.inheritors.forEach(inheritor => inheritor.setConfig(update));
  }
}

const HTTP_HEADER_CONTENT_TYPE = 'Content-Type';
const HTTP_HEADER_AUTHORIZATION = 'Authorization';
const CONTENT_TYPE_APPLICATION_JSON = 'application/json';

export interface IInvokeEndpointParams {
  serverURL?: string;
  token?: string;
  data?: any;
  formdata?: any;
  path: string;
  headers?: Record<string, string>;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export async function invokeEndpoint(props: IInvokeEndpointParams) {
  const {data, path, headers, method, token, formdata, serverURL} = props;
  const incomingHeaders = {...headers};
  let contentBody = undefined;

  if (formdata) {
    const contentFormdata = new FormData();
    for (const key in formdata) {
      if (formdata[key] !== undefined)
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

  const endpointURL = (serverURL || defaultServerURL) + path;
  const result = await fetch(endpointURL, {
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

  let errors: FimidaraEndpointErrorItem[] = [];
  if (isResultJSON) {
    const body = (await result.json()) as
      | {errors: FimidaraEndpointErrorItem[]}
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

export class FimidaraEndpointsBase extends FimidaraJsConfig {
  protected getAuthToken(params?: {authToken?: string}) {
    return params?.authToken || this.config.authToken;
  }

  protected getServerURL(params?: {serverURL?: string}) {
    return params?.serverURL || this.config.serverURL;
  }
}

export type FimidaraEndpointResult<T> = {
  body: T;
  headers: typeof Headers;
};
export type FimidaraEndpointParamsOptional<T> = {
  serverURL?: string;
  authToken?: string;
  body?: T;
};
export type FimidaraEndpointParamsRequired<T> = {
  serverURL?: string;
  authToken?: string;
  body: T;
};

export function getReadFileURL(props: {
  /** Filepath including workspace rootname. */
  filepath: string;
  width?: number;
  height?: number;
  serverURL?: string;
}) {
  let query = '';
  if (props.width) query += `w=${props.width.toFixed()}`;
  if (props.height)
    query += (query.length ? '&' : '') + `h=${props.height.toFixed()}`;
  if (query) query = '?' + query;

  return (
    (props.serverURL || defaultServerURL) +
    '/v1/files/readFile' +
    encodeURIComponent(props.filepath) +
    query
  );
}

export function getUploadFileURL(props: {
  filepath: string;
  serverURL?: string;
}) {
  return (
    (props.serverURL || defaultServerURL) +
    '/v1/files/uploadFile' +
    encodeURIComponent(props.filepath)
  );
}
