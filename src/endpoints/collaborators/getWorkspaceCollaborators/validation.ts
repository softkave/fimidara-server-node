import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspaceCollaboratorsEndpointParams} from './types';

export const getWorkspaceCollaboratorsJoiSchema = Joi.object<IGetWorkspaceCollaboratorsEndpointParams>()
  .keys({
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
    workspaceId: validationSchemas.resourceId,
  })
  .required();
