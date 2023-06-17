import {fetch, Headers} from 'cross-fetch';
import FormData from 'isomorphic-form-data';
import {compact, isArray, last, map} from 'lodash';
import path from 'path';
import {File, Folder} from './publicTypes';

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
  isFimidaraEndpointError = true;

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

  protected async executeRaw(
    p01: Pick<IInvokeEndpointParams, 'data' | 'formdata' | 'path' | 'method'>,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'>
  ) {
    const response = await invokeEndpoint({
      serverURL: this.getServerURL(p02),
      token: this.getAuthToken(p02),
      ...p01,
    });
    const result = {
      headers: response.headers as any,
      body: response,
    };
    return result;
  }

  protected async executeJson(
    p01: Pick<IInvokeEndpointParams, 'data' | 'formdata' | 'path' | 'method'>,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'>
  ) {
    const response = await this.executeRaw(p01, p02);
    const result = {
      headers: response.headers,
      body: (await response.body.json()) as any,
    };
    return result;
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
  /** Filepath including workspace rootname. */
  filepath?: string;
  workspaceRootname?: string;
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
};
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
};
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
};
export type ImageFormatEnum = ObjectValues<typeof ImageFormatEnumMap>;

export type GetFimidaraReadFileURLProps = {
  /** Filepath including workspace rootname. */
  filepath?: string;
  workspaceRootname?: string;
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
    (props.serverURL || defaultServerURL) +
    '/v1/files/readFile' +
    (filepath.startsWith('/') ? '' : '/') +
    encodeURIComponent(filepath) +
    query
  );
}

export function getFimidaraUploadFileURL(props: {
  /** Filepath including workspace rootname. */
  filepath?: string;
  workspaceRootname?: string;
  filepathWithoutRootname?: string;
  serverURL?: string;
}) {
  const filepath = getFilepath(props);
  return (
    (props.serverURL || defaultServerURL) +
    '/v1/files/uploadFile' +
    (filepath.startsWith('/') ? '' : '/') +
    encodeURIComponent(filepath)
  );
}

export function stringifyFimidaraFileNamePath(
  file: Pick<File, 'namePath' | 'extension'>,
  rootname?: string
) {
  const nm =
    file.namePath.join('/') + (file.extension ? `.${file.extension}` : '');
  return rootname ? fimidaraAddRootnameToPath(nm, rootname) : nm;
}

export function stringifyFimidaraFolderNamePath(
  file: Pick<Folder, 'namePath'>,
  rootname?: string
) {
  const nm = file.namePath.join('/');
  return rootname ? fimidaraAddRootnameToPath(nm, rootname) : nm;
}
