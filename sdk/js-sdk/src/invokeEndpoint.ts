import axios, {
  AxiosProgressEvent,
  AxiosResponse,
  Method,
  toFormData,
} from 'axios';
import {AnyObject} from 'softkave-js-utils';
import {kDefaultServerURL} from './constants.js';
import {FimidaraEndpointError, FimidaraEndpointErrorItem} from './error.js';
import {FimidaraEndpointHeaders} from './types.js';

function isNodeEnv() {
  return typeof window === 'undefined' && typeof process === 'object';
}

// function isBrowserEnv() {
//   return !isNodeEnv();
// }

const HTTP_HEADER_CONTENT_TYPE = 'content-type';
const HTTP_HEADER_CONTENT_LENGTH = 'Content-Length';
const HTTP_HEADER_AUTHORIZATION = 'authorization';
const CONTENT_TYPE_APPLICATION_JSON = 'application/json';

export interface InvokeEndpointParams {
  serverURL?: string;
  path?: string;
  endpointURL?: string;
  token?: string;
  data?: any;
  formdata?: any;
  headers?: FimidaraEndpointHeaders;
  query?: AnyObject;
  method: Method;
  responseType: 'blob' | 'json' | 'stream';
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export async function invokeEndpoint(props: InvokeEndpointParams) {
  const {
    serverURL,
    path,
    data,
    headers,
    method,
    token,
    formdata,
    responseType,
    query,
    onDownloadProgress,
    onUploadProgress,
    endpointURL: propsEndpointURL,
  } = props;
  const outgoingHeaders = {...headers};
  let contentBody = undefined;

  if (formdata) {
    contentBody = toFormData(formdata);
  } else if (data) {
    const str = JSON.stringify(data);
    contentBody = str;
    outgoingHeaders[HTTP_HEADER_CONTENT_TYPE] = CONTENT_TYPE_APPLICATION_JSON;

    if (
      isNodeEnv() &&
      (!outgoingHeaders[HTTP_HEADER_CONTENT_LENGTH] ||
        !outgoingHeaders[HTTP_HEADER_CONTENT_LENGTH.toLowerCase()])
    ) {
      const textEncoder = new TextEncoder();
      outgoingHeaders[HTTP_HEADER_CONTENT_LENGTH] =
        textEncoder.encode(str).length;
    }
  }

  if (token) {
    outgoingHeaders[HTTP_HEADER_AUTHORIZATION] = `Bearer ${token}`;
  }

  const endpointURL =
    propsEndpointURL || (serverURL || kDefaultServerURL) + path;

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
      params: query,
      url: endpointURL,
      headers: outgoingHeaders,
      data: contentBody,
      maxRedirects: 0, // avoid buffering the entire stream
    });

    return result;
  } catch (axiosError: unknown) {
    let errors: FimidaraEndpointErrorItem[] = [];
    let statusCode: number | undefined = undefined;
    let statusText: string | undefined = undefined;
    let responseHeaders: FimidaraEndpointHeaders | undefined = undefined;

    if ((axiosError as any).response) {
      // The request was made and the server responded with a status code that
      // falls out of the range of 2xx
      const response = (axiosError as any).response as AxiosResponse;

      statusCode = response.status;
      statusText = response.statusText;
      responseHeaders = response.headers as FimidaraEndpointHeaders;

      const contentType = response.headers[HTTP_HEADER_CONTENT_TYPE];
      const isResultJSON =
        typeof contentType === 'string' &&
        contentType.includes(CONTENT_TYPE_APPLICATION_JSON);

      if (isResultJSON && typeof response.data === 'string') {
        const body = JSON.parse(response.data);
        if (Array.isArray(body?.errors)) errors = body.errors;
      } else if (
        typeof response.data === 'object' &&
        Array.isArray(response.data.errors)
      ) {
        errors = response.data.errors;
      }
    } else if ((axiosError as any).request) {
      // The request was made but no response was received `error.request` is an
      // instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.log('Error', error.message);
    }

    // TODO: show axios and network errors
    throw new FimidaraEndpointError(
      errors,
      statusCode,
      statusText,
      responseHeaders
    );
  }
}
