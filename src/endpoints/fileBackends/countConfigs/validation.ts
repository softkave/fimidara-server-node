import * as Joi from 'joi';
import {CountFileBackendConfigsEndpointParams} from './types.js';
import {getFileBackendConfigsBaseJoiSchemaParts} from '../getConfigs/validation.js';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountFileBackendConfigsEndpointParams>()
    .keys(getFileBackendConfigsBaseJoiSchemaParts)
    .required();
