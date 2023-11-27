import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {GetFileBackendConfigEndpointParams} from './types';

export const getFileBackendConfigJoiSchema =
  Joi.object<GetFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      tokenId: validationSchemas.resourceId,
      onReferenced: Joi.boolean(),
    })
    .required();
