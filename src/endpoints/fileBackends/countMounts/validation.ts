import * as Joi from 'joi';
import {getWorkspaceAgentTokenBaseJoiSchemaParts} from '../getMounts/validation';
import {CountFileBackendMountsEndpointParams} from './types';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountFileBackendMountsEndpointParams>()
    .keys(getWorkspaceAgentTokenBaseJoiSchemaParts)
    .required();
