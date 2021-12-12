import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import {folderConstants} from './constants';

// TODO: add max length from unix and check for illegal characters from unix
// don't use alphanumeric characters
const path = validationSchemas.alphanum
  .min(folderConstants.minFolderNameLength)
  .max(folderConstants.maxFolderNameLength * folderConstants.maxFolderDepth);

const name = Joi.string()
  .max(folderConstants.maxFolderNameLength)
  .min(folderConstants.minFolderNameLength);

const folderValidationSchemas = {path, name};

export default folderValidationSchemas;
