import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import {endpointValidationSchemas} from '../../validation';
import {IAddAgentTokenEndpointParams} from './types';

export const addAgentTokenJoiSchema = Joi.object<IAddAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    token: Joi.object<IAddAgentTokenEndpointParams['token']>()
      .keys({
        expires: validationSchemas.time.allow(null),
        providedResourceId: validationSchemas.providedResourceId.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
