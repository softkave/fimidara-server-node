import axios, {
  AxiosProgressEvent,
  AxiosResponse,
  Method,
  toFormData,
} from 'axios';
import {compact, isArray, isObject, isString, last, map} from 'lodash';
import path from 'path-browserify';

const kDefaultServerURL = 'https://api.fimidara.com';

export type EndpointHeaders = {
  [key: string]: string | string[] | number | boolean | null;
};

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
  isFimidaraEndpointError = true;

  constructor(
    public errors: Array<FimidaraEndpointErrorItem>,
    public statusCode?: number,
    public statusText?: string,
    public headers?: EndpointHeaders
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

const HTTP_HEADER_CONTENT_TYPE = 'content-type';
const HTTP_HEADER_AUTHORIZATION = 'authorization';
const CONTENT_TYPE_APPLICATION_JSON = 'application/json';

export interface IInvokeEndpointParams {
  serverURL?: string;
  token?: string;
  data?: any;
  formdata?: any;
  path: string;
  headers?: EndpointHeaders;
  method: Method;
  responseType: 'blob' | 'json' | 'stream';
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export async function invokeEndpoint(props: IInvokeEndpointParams) {
  const {
    data,
    path,
    headers,
    method,
    token,
    formdata,
    serverURL,
    responseType,
    onDownloadProgress,
    onUploadProgress,
  } = props;
  const incomingHeaders = {...headers};
  let contentBody = undefined;

  if (formdata) {
    contentBody = toFormData(formdata);
  } else if (data) {
    contentBody = data;
  }

  if (token) {
    incomingHeaders[HTTP_HEADER_AUTHORIZATION] = `Bearer ${token}`;
  }

  const endpointURL = (serverURL || kDefaultServerURL) + path;

  try {
    /**
     * Axios accepts the following:
     * - string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
     * - Browser only: FormData, File, Blob
     * - Node only: Stream, Buffer
     *
     * TODO: enforce environment dependent options or have a universal
     * transformRequest
     */
    const result = await axios({
      method,
      responseType,
      onUploadProgress,
      onDownloadProgress,
      url: endpointURL,
      headers: incomingHeaders,
      data: contentBody,
      maxRedirects: 0, // avoid buffering the entire stream
    });

    return result;
  } catch (error: unknown) {
    let errors: FimidaraEndpointErrorItem[] = [];
    let statusCode: number | undefined = undefined;
    let statusText: string | undefined = undefined;
    let responseHeaders: EndpointHeaders | undefined = undefined;

    if ((error as any).response) {
      // The request was made and the server responded with a status code that
      // falls out of the range of 2xx
      const response = (error as any).response as AxiosResponse;
      // console.log(response.data);
      // console.log(response.status);
      // console.log(response.headers);

      statusCode = response.status;
      statusText = response.statusText;
      responseHeaders = response.headers as EndpointHeaders;

      const contentType = response.headers[HTTP_HEADER_CONTENT_TYPE];
      const isResultJSON =
        isString(contentType) &&
        contentType.includes(CONTENT_TYPE_APPLICATION_JSON);

      if (isResultJSON && isString(response.data)) {
        const body = JSON.parse(response.data);
        if (isArray(body?.errors)) errors = body.errors;
      } else if (
        isObject(response.data) &&
        isArray((response.data as any).errors)
      ) {
        errors = (response.data as any).errors;
      }
    } else if ((error as any).request) {
      // The request was made but no response was received `error.request` is an
      // instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.log('Error', error.message);
    }

    throw new FimidaraEndpointError(
      errors,
      statusCode,
      statusText,
      responseHeaders
    );
  }
}

export class FimidaraEndpointsBase extends FimidaraJsConfig {
  protected mapping?: Map<
    string,
    ['header' | 'path' | 'query' | 'body', string]
  >;

  protected getAuthToken(params?: {authToken?: string}) {
    return params?.authToken || this.config.authToken;
  }

  protected getServerURL(params?: {serverURL?: string}) {
    return params?.serverURL || this.config.serverURL;
  }

  protected async executeRaw(
    p01: IInvokeEndpointParams,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'>
  ): Promise<FimidaraEndpointResult<any>> {
    const response = await invokeEndpoint({
      serverURL: this.getServerURL(p02),
      token: this.getAuthToken(p02),
      ...p01,
    });
    return {
      status: response.status,
      statusText: response.statusText,
      body: response.data,
      headers: response.headers as EndpointHeaders,
    };
  }

  protected async executeJson(
    p01: Pick<IInvokeEndpointParams, 'data' | 'formdata' | 'path' | 'method'>,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'>
  ) {
    return await this.executeRaw({...p01, responseType: 'json'}, p02);
  }

  protected mapToHeaders(p01: IInvokeEndpointParams) {
    if (!this.mapping || !p01.data) return {};
    return Object.keys(p01.data).reduce((headers, key) => {}, {});
  }
}

export type FimidaraEndpointResult<T> = {
  status: number;
  statusText: string;
  body: T;
  headers: EndpointHeaders;
};
export type FimidaraEndpointProgressEvent = AxiosProgressEvent;
export type FimidaraEndpointParamsRequired<T> = {
  body: T;
  serverURL?: string;
  authToken?: string;

  /** **NOTE**: doesn't work in Node.js at the moment. */
  onUploadProgress?: (progressEvent: FimidaraEndpointProgressEvent) => void;
  onDownloadProgress?: (progressEvent: FimidaraEndpointProgressEvent) => void;
};
export type FimidaraEndpointWithBinaryResponseParamsRequired<T> =
  FimidaraEndpointParamsRequired<T> & {
    responseType: 'blob' | 'stream';
  };
export type FimidaraEndpointParamsOptional<T> = Partial<
  FimidaraEndpointParamsRequired<T>
>;
export type FimidaraEndpointWithBinaryResponseParamsOptional<T> =
  FimidaraEndpointParamsOptional<T> & {
    responseType: 'blob' | 'stream';
  };

export function fimidaraAddRootnameToPath<
  T extends string | string[] = string | string[]
>(fPath: T, workspaceRootname: string | string[]): T {
  const rootname = isArray(workspaceRootname)
    ? last(workspaceRootname)
    : workspaceRootname;

  if (isArray(fPath)) {
    return <T>[rootname, ...fPath];
  }

  return <T>path.posix.normalize(`${rootname}/${fPath}`);
}

function getFilepath(props: {
  /** Filepath including workspace rootname OR file presigned path. */
  filepath?: string;
  workspaceRootname?: string;

  /** Filepath without workspace rootname. Does not accept file presigned paths. */
  filepathWithoutRootname?: string;
}) {
  const filepath = props.filepath
    ? props.filepath
    : props.filepathWithoutRootname && props.workspaceRootname
    ? fimidaraAddRootnameToPath(
        props.filepathWithoutRootname,
        props.workspaceRootname
      )
    : undefined;

  if (!filepath) throw new Error('Filepath not provided.');
  return filepath;
}

export type ObjectValues<T> = T[keyof T];
export const ImageResizeFitEnumMap = {
  contain: 'contain',
  cover: 'cover',
  fill: 'fill',
  inside: 'inside',
  outside: 'outside',
} as const;
export const ImageResizePositionEnumMap = {
  top: 'top',
  rightTop: 'right top',
  right: 'right',
  rightBottom: 'right bottom',
  bottom: 'bottom',
  leftBottom: 'left bottom',
  left: 'left',
  leftTop: 'left top',
  north: 'north',
  northeast: 'northeast',
  east: 'east',
  southeast: 'southeast',
  south: 'south',
  southwest: 'southwest',
  west: 'west',
  northwest: 'northwest',
  centre: 'centre',

  /** focus on the region with the highest Shannon entropy. */
  entropy: 'entropy',

  /** focus on the region with the highest luminance frequency, colour
   * saturation and presence of skin tones. */
  attention: 'attention',
} as const;
export type ImageResizeFitEnum = ObjectValues<typeof ImageResizeFitEnumMap>;
export type ImageResizePositionEnum = ObjectValues<
  typeof ImageResizePositionEnumMap
>;

export type ImageResizeParams = {
  width?: number;
  height?: number;

  /** How the image should be resized to fit both provided dimensions.
   * (optional, default 'cover') */
  fit?: keyof ImageResizeFitEnum;

  /** Position, gravity or strategy to use when fit is cover or contain.
   * (optional, default 'centre') */
  position?: number | ImageResizePositionEnum;

  /** Background colour when using a fit of contain, defaults to black without
   * transparency. (optional, default {r:0,g:0,b:0,alpha:1}) */
  background?: string;

  /** Do not enlarge if the width or height are already less than the specified
   * dimensions. (optional, default false) */
  withoutEnlargement?: boolean;
};

export const ImageFormatEnumMap = {
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  tiff: 'tiff',
  raw: 'raw',

  // TODO: support gif
} as const;
export type ImageFormatEnum = ObjectValues<typeof ImageFormatEnumMap>;

export type GetFimidaraReadFileURLProps = {
  /** Filepath including workspace rootname OR file presigned path. */
  filepath?: string;
  workspaceRootname?: string;

  /** Filepath without workspace rootname. Does not accept file presigned paths. */
  filepathWithoutRootname?: string;
  serverURL?: string;
  width?: number;
  height?: number;

  /** How the image should be resized to fit both provided dimensions.
   * (optional, default 'cover') */
  fit?: keyof ImageResizeFitEnum;

  /** Position, gravity or strategy to use when fit is cover or contain.
   * (optional, default 'centre') */
  position?: number | ImageResizePositionEnum;

  /** Background colour when using a fit of contain, defaults to black without
   * transparency. (optional, default {r:0,g:0,b:0,alpha:1}) */
  background?: string;

  /** Do not enlarge if the width or height are already less than the specified
   * dimensions. (optional, default false) */
  withoutEnlargement?: boolean;
};

// export type ReadFileEndpointHttpQuery = {
//   w?: number;
//   h?: number;
//   fit?: keyof ImageResizeFitEnum;
//   pos?: number | ImageResizePositionEnum;
//   bg?: string;
//   wEnlargement?: boolean;
//   format?: ImageFormatEnum;
// };

const kReadFileQueryMap: Partial<
  Record<keyof GetFimidaraReadFileURLProps, string>
> = {
  width: 'w',
  height: 'h',
  fit: 'fit',
  position: 'pos',
  background: 'bg',
  withoutEnlargement: 'wEnlargement',
};

export function getFimidaraReadFileURL(props: GetFimidaraReadFileURLProps) {
  let query = '';
  const filepath = getFilepath(props);
  const queryList = compact(
    map(props, (v, k) => {
      const qk = kReadFileQueryMap[k as keyof GetFimidaraReadFileURLProps];
      if (!qk) return undefined;
      return `${qk}=${String(v)}`;
    })
  );

  if (queryList.length) {
    query = `?${queryList.join('&')}`;
  }

  return (
    (props.serverURL || kDefaultServerURL) +
    '/v1/files/readFile' +
    (filepath.startsWith('/') ? '' : '/') +
    encodeURIComponent(filepath) +
    query
  );
}

export function getFimidaraUploadFileURL(props: {
  /** Filepath including workspace rootname OR file presigned path. */
  filepath?: string;
  workspaceRootname?: string;

  /** Filepath without workspace rootname. Does not accept file presigned paths. */
  filepathWithoutRootname?: string;
  serverURL?: string;
}) {
  const filepath = getFilepath(props);
  return (
    (props.serverURL || kDefaultServerURL) +
    '/v1/files/uploadFile' +
    (filepath.startsWith('/') ? '' : '/') +
    encodeURIComponent(filepath)
  );
}

export function stringifyFimidaraFileNamePath(
  file: {namePath: string[]; extension?: string},
  rootname?: string
) {
  const name =
    file.namePath.join('/') + (file.extension ? `.${file.extension}` : '');
  return rootname ? fimidaraAddRootnameToPath(name, rootname) : name;
}

export function stringifyFimidaraFolderNamePath(
  file: {namePath: string[]; extension?: string},
  rootname?: string
) {
  const name = file.namePath.join('/');
  return rootname ? fimidaraAddRootnameToPath(name, rootname) : name;
}
