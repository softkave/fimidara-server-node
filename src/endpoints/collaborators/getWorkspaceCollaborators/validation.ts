import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspaceCollaboratorsEndpointParams,
  IGetWorkspaceCollaboratorsEndpointParamsBase,
} from './types';

export const getWorkspaceCollaboratorsBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceCollaboratorsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceCollaboratorsJoiSchema =
  Joi.object<IGetWorkspaceCollaboratorsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.paginationParts,
      ...getWorkspaceCollaboratorsBaseJoiSchemaParts,
    })
    .required();
