import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';

export const deleteFileBackendMountJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: validationSchemas.resourceId,
    onReferenced: Joi.boolean(),
  })
  .required();