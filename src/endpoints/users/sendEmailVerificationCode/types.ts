import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type SendEmailVerificationCodeEndpointParams = {};
export type SendEmailVerificationCodeEndpoint = Endpoint<
  BaseContextType,
  SendEmailVerificationCodeEndpointParams
>;
