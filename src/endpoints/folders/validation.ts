import {validationSchemas} from '../../utilities/validationUtils';
import {folderConstants} from './constants';

// TODO: add max length from unix and check for illegal characters from unix
// don't use alphanumeric characters
const concatFolderName = validationSchemas.alphanum
  .min(folderConstants.minFolderNameLength)
  .max(
    folderConstants.maxFolderNameLength * folderConstants.maxConcatFolderNames
  );

const folderValidationSchemas = {concatFolderName};

export default folderValidationSchemas;
