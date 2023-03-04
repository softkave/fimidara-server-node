import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetAgentTokenEndpointParams} from './types';

export const getAgentTokenJoiSchema = Joi.object<IGetAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: validationSchemas.resourceId,
    onReferenced: Joi.boolean(),
  })
  .required();
