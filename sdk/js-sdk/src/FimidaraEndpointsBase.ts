import assert from 'assert';
import {AnyObject} from 'softkave-js-utils';
import {FimidaraJsConfig} from './config.js';
import {InvokeEndpointParams, invokeEndpoint} from './invokeEndpoint.js';
import {FimidaraEndpointParamsOptional} from './types.js';

export type Mapping = Record<
  string,
  readonly ['header' | 'path' | 'query' | 'body', string]
>;

export class FimidaraEndpointsBase extends FimidaraJsConfig {
  protected getAuthToken(params?: {authToken?: string}) {
    return params?.authToken || this.config.authToken;
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
      Object.keys(data).forEach(key => {
        const value = data[key];
        const [mapTo, field] = mapping[key] ?? [];

        switch (mapTo) {
          case 'header': {
            headers[field] = value;
            break;
          }

          case 'query': {
            query[field] = value;
            break;
          }

          case 'path': {
            endpointPath = endpointPath.replace(
              `:${field}`,
              encodeURIComponent(value)
            );
            break;
          }

          case 'body':
          default:
            body[field || key] = value;
        }
      });
    } else if (data) {
      body = data;
    }

    return {headers, query, endpointPath, data: body};
  }

  protected async executeRaw(
    p01: InvokeEndpointParams,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'>,
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
      onDownloadProgress: p01.onUploadProgress,
      onUploadProgress: p01.onDownloadProgress,
    });

    return response.data;
  }

  protected async executeJson(
    p01: Pick<InvokeEndpointParams, 'data' | 'formdata' | 'path' | 'method'>,
    p02?: Pick<FimidaraEndpointParamsOptional<any>, 'authToken' | 'serverURL'>,
    mapping?: Mapping
  ) {
    return await this.executeRaw({...p01, responseType: 'json'}, p02, mapping);
  }
}
