import * as Joi from 'joi';
import {CountFileBackendConfigsEndpointParams} from './types';
import {getFileBackendConfigsBaseJoiSchemaParts} from '../getConfigs/validation';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountFileBackendConfigsEndpointParams>()
    .keys(getFileBackendConfigsBaseJoiSchemaParts)
    .required();
