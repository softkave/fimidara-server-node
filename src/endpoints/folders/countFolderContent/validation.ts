import Joi from 'joi';
import {FolderMatcher} from '../../../definitions/folder.js';
import {listFolderContentBaseJoiSchemaParts} from '../listFolderContent/validation.js';

export const countFolderContentJoiSchema = Joi.object<FolderMatcher>()
  .keys(listFolderContentBaseJoiSchemaParts)
  .required();
