import * as Joi from 'joi';
import {IFolderMatcher} from '../../../definitions/folder';
import {listFolderContentBaseJoiSchemaParts} from '../listFolderContent/validation';

export const countFolderContentJoiSchema = Joi.object<IFolderMatcher>()
  .keys(listFolderContentBaseJoiSchemaParts)
  .required();
