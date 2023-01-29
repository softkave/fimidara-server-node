import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspaceTagsEndpointParams} from './types';

export const getWorkspaceTagJoiSchema = Joi.object<IGetWorkspaceTagsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
