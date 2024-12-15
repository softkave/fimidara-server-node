import assert from 'assert';
import {isString} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {FimidaraJsConfig, FimidaraJsConfigAuthToken} from './config.js';
import {InvokeEndpointParams, invokeEndpoint} from './invokeEndpoint.js';
import {FimidaraEndpointParamsOptional} from './types.js';

export type Mapping = Record<
  string,
  readonly ['header' | 'path' | 'query' | 'body', string]
>;

export class FimidaraEndpointsBase extends FimidaraJsConfig {
  protected getAuthToken(params?: {authToken?: FimidaraJsConfigAuthToken}) {
    const authToken = params?.authToken || this.config.authToken;
    return isString(authToken) ? authToken : authToken?.getJwtToken();
  }

  protected getServerURL(params?: {serverURL?: string}) {
    return params?.serverURL || this.config.serverURL;
  }

  protected applyMapping(
    endpointPath: string,
    data?: AnyObject,
    mapping?: Mapping
  ) {
    const headers: AnyObject = {};
    const query: AnyObject = {};
    let body: AnyObject = {};

    if (mapping && data) {
      const path: AnyObject = {};
      Object.entries(data).forEach(([key, value]) => {
        const [mapTo, field] = mapping[key] ?? [];

        switch (mapTo) {
          case 'header':
            headers[field] = value;
            break;

          case 'query':
            query[field] = value;
            break;

          case 'path':
            path[field] = value;
            break;

          case 'body':
          default:
            body[field || key] = value;
        }
      });

      Object.entries(path).forEach(([key, value]) => {
        endpointPath = endpointPath.replace(
          `:${key}`,
          encodeURIComponent(value)
        );
      });
    } else if (data) {
      body = data;
    }

    return {headers, query, endpointPath, data: body};
  }

  protected async executeRaw(
    p01: InvokeEndpointParams,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'> &
      /** for binary options */ Pick<
        InvokeEndpointParams,
        'onUploadProgress' | 'onDownloadProgress'
      >,
    mapping?: Mapping
  ) {
    assert(p01.path, 'Endpoint path not provided');
    const {headers, query, data, endpointPath} = this.applyMapping(
      p01.path,
      p01.data || p01.formdata,
      mapping
    );

    if (endpointPath.includes('/:')) {
      console.log(`invalid path ${endpointPath}, params not injected`);
      throw new Error('SDK error');
    }

    const response = await invokeEndpoint({
      query,
      headers,
      data: p01.data ? data : undefined,
      formdata: p01.formdata ? data : undefined,
      serverURL: this.getServerURL(p02),
      token: this.getAuthToken(p02),
      path: endpointPath,
      method: p01.method,
      responseType: p01.responseType,
      onDownloadProgress: p02?.onDownloadProgress || p01.onDownloadProgress,
      onUploadProgress: p02?.onUploadProgress || p01.onUploadProgress,
    });

    return response.data;
  }

  protected async executeJson(
    p01: Pick<InvokeEndpointParams, 'data' | 'formdata' | 'path' | 'method'>,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'> &
      /** for binary options */ Pick<
        InvokeEndpointParams,
        'onUploadProgress' | 'onDownloadProgress'
      >,
    mapping?: Mapping
  ) {
    return await this.executeRaw({...p01, responseType: 'json'}, p02, mapping);
  }
}
