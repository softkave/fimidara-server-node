import * as Joi from 'joi';
import {FolderMatcher} from '../../../definitions/folder';
import {listFolderContentBaseJoiSchemaParts} from '../listFolderContent/validation';

export const countFolderContentJoiSchema = Joi.object<FolderMatcher>()
  .keys(listFolderContentBaseJoiSchemaParts)
  .required();
