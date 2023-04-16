/**
 * An attempt at extracting API definitions from types to build API documentations.
 * Currently in hiatus.
 */

type IFileMatcher = {
  // file path with workspace root name
  filepath?: string;
  fileId?: string;
};

type IImageTransformationParams = {
  width?: number;
  height?: number;
};

type IGetFileEndpointParams = {
  imageTranformation?: IImageTransformationParams;
} & IFileMatcher;

type ObjectValues<T> = T[keyof T];
type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S;
type GetRouteParameter<S extends string> = RemoveTail<
  RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
  `.${string}`
>;

interface ParamsDictionary {
  [key: string]: string;
}

type RouteParameters<Route extends string> = string extends Route
  ? ParamsDictionary
  : Route extends `${string}(${string}`
  ? ParamsDictionary //TODO: handling for regex parameters
  : Route extends `${string}:${infer Rest}`
  ? (GetRouteParameter<Rest> extends never
      ? ParamsDictionary
      : GetRouteParameter<Rest> extends `${infer ParamName}?`
      ? {[P in ParamName]?: string}
      : {[P in GetRouteParameter<Rest>]: string}) &
      (Rest extends `${GetRouteParameter<Rest>}${infer Next}` ? RouteParameters<Next> : unknown)
  : {};

const HttpEndpointMethodsMap = {
  Get: 'get',
  Post: 'post',
  Delete: 'delete',
} as const;

type HttpEndpointMethod = ObjectValues<typeof HttpEndpointMethodsMap>;
type HttpEndpointQuery = Record<string, string | number | boolean>;
type HttpEndpointBodyLiterals = string | number | boolean | null | undefined | Date;
type HttpEndpointBodyObjectMap = {
  [Key: string]:
    | HttpEndpointBodyLiterals
    | Array<HttpEndpointBodyLiterals>
    | HttpEndpointBodyObjectMap;
};

type HttpEndpointBodyMultipartFormDataBlob = '<<<multipart/form-data blob>>>';
type HttpEndpointBodyMultipartFormDataMap = {
  [Key: string]: HttpEndpointBodyLiterals | HttpEndpointBodyMultipartFormDataBlob;
};

type HttpEndpointBodyMultipartFormData =
  | HttpEndpointBodyMultipartFormDataBlob
  | HttpEndpointBodyMultipartFormDataMap;
type HttpEndpointRequestBody = HttpEndpointBodyObjectMap;
//| HttpEndpointBodyMultipartFormData | undefined;
type HttpEndpointResultBlob = '<<<http result blob>>>';
type HttpEndpointResponseBody = HttpEndpointBodyObjectMap | HttpEndpointResultBlob | undefined;
type HttpEndpointHeaders = Record<string, string>;

type HttpEndpoint<
  HttpEndpointMethod_ extends HttpEndpointMethod,
  HttpEndpointPathname_ extends string,
  HttpEndpointQuery_ extends HttpEndpointQuery | undefined,
  HttpEndpointRequestHeaders_ extends HttpEndpointHeaders,
  HttpEndpointRequestBody_ extends HttpEndpointRequestBody,
  HttpEndpointResposneHeaders_ extends HttpEndpointHeaders,
  HttpEndpointResponseBody_ extends HttpEndpointResponseBody
> = {
  method: HttpEndpointMethod_;
  pathname: HttpEndpointPathname_;
  pathnameParameters: RouteParameters<HttpEndpointPathname_>;
  query: HttpEndpointQuery_;
  requestHeaders: HttpEndpointRequestHeaders_;
  requestBody: HttpEndpointRequestBody_;
  responseHeaders: HttpEndpointResposneHeaders_;
  responseBody: HttpEndpointResponseBody_;
};

type GF00001234 = HttpEndpoint<
  'get',
  '/files/getFile',
  undefined,
  {Authorization: string},
  IGetFileEndpointParams,
  {'Content-Type': string},
  HttpEndpointResultBlob
>;

/**
 * Endpoint
 * HTTPEndpoint
 * Exported endpoints
 */
