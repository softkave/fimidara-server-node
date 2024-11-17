import {Endpoint} from '../../types.js';

export type GetTUSOptionsEndpointParams = {};

export interface GetTUSOptionsEndpointResult {
  version: string;
  extensions: string[];
  resumable: string;
  maxSize: number;
}

export type GetTUSOptionsEndpoint = Endpoint<
  GetTUSOptionsEndpointParams,
  GetTUSOptionsEndpointResult
>;
