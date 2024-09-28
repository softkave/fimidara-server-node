import {AxiosProgressEvent} from 'axios';
import type {Readable} from 'stream';

export type FimidaraEndpointHeaders = {
  [key: string]: string | string[] | number | boolean | null;
};

export type FimidaraEndpointResultWithBinaryResponse<
  TResponseType extends 'blob' | 'stream'
> = TResponseType extends 'blob'
  ? Blob
  : TResponseType extends 'stream'
  ? Readable
  : unknown;

export type FimidaraEndpointProgressEvent = AxiosProgressEvent;

export type FimidaraEndpointParamsRequired<T> = {
  body: T;
  serverURL?: string;
  authToken?: string;

  /** **NOTE**: doesn't work in Node.js at the moment. */
  onUploadProgress?: (progressEvent: FimidaraEndpointProgressEvent) => void;
  /** **NOTE**: doesn't work in Node.js at the moment. */
  onDownloadProgress?: (progressEvent: FimidaraEndpointProgressEvent) => void;
};

export type FimidaraEndpointOpts = {
  serverURL?: string;
  authToken?: string;
};

export type FimidaraEndpointUploadBinaryOpts = FimidaraEndpointOpts & {
  /** **NOTE**: doesn't work in Node.js at the moment. */
  onUploadProgress?: (progressEvent: FimidaraEndpointProgressEvent) => void;
};

export type FimidaraEndpointDownloadBinaryOpts<
  TResponseType extends 'blob' | 'stream'
> = FimidaraEndpointOpts & {
  responseType: TResponseType;
  /** **NOTE**: doesn't work in Node.js at the moment. */
  onDownloadProgress?: (progressEvent: FimidaraEndpointProgressEvent) => void;
};

export type FimidaraEndpointWithBinaryResponseParamsRequired<
  T,
  TResponseType extends 'blob' | 'stream'
> = FimidaraEndpointParamsRequired<T> & {
  responseType: TResponseType;
};

export type FimidaraEndpointParamsOptional<T> = Partial<
  FimidaraEndpointParamsRequired<T>
>;

export type FimidaraEndpointWithBinaryResponseParamsOptional<
  T,
  TResponseType extends 'blob' | 'stream'
> = FimidaraEndpointParamsOptional<T> & {
  responseType: TResponseType;
};
