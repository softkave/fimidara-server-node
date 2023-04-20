import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type SendEmailVerificationCodeEndpointParams = {};
export type SendEmailVerificationCodeEndpoint = Endpoint<
  BaseContext,
  SendEmailVerificationCodeEndpointParams
>;
