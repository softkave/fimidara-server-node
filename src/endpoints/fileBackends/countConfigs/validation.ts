import * as Joi from 'joi';
import {getWorkspaceAgentTokenBaseJoiSchemaParts} from '../getConfigs/validation';
import {CountFileBackendConfigsEndpointParams} from './types';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountFileBackendConfigsEndpointParams>()
    .keys(getWorkspaceAgentTokenBaseJoiSchemaParts)
    .required();
