import Joi from 'joi';
import {getFileBackendConfigsBaseJoiSchemaParts} from '../getConfigs/validation.js';
import {CountFileBackendConfigsEndpointParams} from './types.js';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountFileBackendConfigsEndpointParams>()
    .keys(getFileBackendConfigsBaseJoiSchemaParts)
    .required();
