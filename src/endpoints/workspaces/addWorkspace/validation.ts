import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import workspaceValidationSchemas from '../validation';

export const addWorkspaceJoiSchema = Joi.object()
  .keys({
    name: validationSchemas.name.required(),
    rootname: folderValidationSchemas.folderpath.required(),
    description: validationSchemas.description.allow(null),
    usageThresholds: workspaceValidationSchemas.usageThresholdMap,
  })
  .required();
