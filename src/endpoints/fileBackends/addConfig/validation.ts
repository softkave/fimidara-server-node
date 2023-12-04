import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {AddFileBackendConfigEndpointParams} from './types';

export const addConfigJoiSchema = Joi.object<AddFileBackendConfigEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    token: Joi.object<AddFileBackendConfigEndpointParams['token']>()
      .keys({
        expires: validationSchemas.time.allow(null),
        providedResourceId: validationSchemas.providedResourceId.allow(null),
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
