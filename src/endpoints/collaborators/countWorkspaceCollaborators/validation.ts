import * as Joi from 'joi';
import {getWorkspaceCollaboratorsBaseJoiSchemaParts} from '../getWorkspaceCollaborators/validation';
import {ICountWorkspaceCollaboratorsEndpointParams} from './types';

export const countWorkspaceCollaboratorsJoiSchema =
  Joi.object<ICountWorkspaceCollaboratorsEndpointParams>()
    .keys(getWorkspaceCollaboratorsBaseJoiSchemaParts)
    .required();
