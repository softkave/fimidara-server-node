import {fetch, Headers} from 'cross-fetch';
import FormData from 'isomorphic-form-data';

type FimidaraEndpointErrorItem = {
  name: string;
  message: string;
  field?: string;

  // TODO: find a way to include in generated doc for when we add new
  // recommended actions
  action?: 'logout' | 'loginAgain' | 'requestChangePassword';
};

export class FimidaraEndpointError extends Error {
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
}

export type FimidaraEndpointResult<T> = {
  body: T;
  headers: typeof Headers;
};
export type FimidaraEndpointParamsOptional<T> = {
  authToken?: string;
  body?: T;
};
export type FimidaraEndpointParamsRequired<T> = {
  authToken?: string;
  body: T;
};

export function getReadFileURL(props: {
  /** Filepath including workspace rootname. */
  filepath: string;
  width?: number;
  height?: number;
}) {
  let query = '';
  if (props.width) query += `w=${props.width.toFixed()}`;
  if (props.height) query += `h=${props.height.toFixed()}`;
  if (query) query = '?' + query;

  return (
    serverAddr +
    'v1/files/readFile' +
    encodeURIComponent(props.filepath) +
    query
  );
}

export function getUploadFileURL(props: {filepath: string}) {
  return (
    serverAddr + 'v1/files/uploadFile' + encodeURIComponent(props.filepath)
  );
}
