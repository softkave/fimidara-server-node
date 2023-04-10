import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import {endpointValidationSchemas} from '../../validation';
import {IUpdateAgentTokenEndpointParams} from './types';

export const updateAgentTokenJoiSchema = Joi.object<IUpdateAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: validationSchemas.resourceId,
    onReferenced: Joi.boolean(),
    token: Joi.object<IUpdateAgentTokenEndpointParams['token']>()
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
