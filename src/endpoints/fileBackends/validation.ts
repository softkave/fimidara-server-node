import Joi from 'joi';
import {kFileBackendType} from '../../definitions/fileBackend';
import {ValidationRegExPatterns, validationConstants} from '../../utils/validationUtils';
import {S3FilePersistenceProviderInitParams} from '../contexts/file/S3FilePersistenceProvider';
import {kFileBackendConstants} from './constants';

const backend = Joi.string().valid(Object.values(kFileBackendType));
const nonFimidaraBackend = Joi.string().valid(
  Object.values(kFileBackendType).filter(backend => backend !== 'fimidara')
);
const credentials = Joi.object().when('backend', {
  switch: [
    {
      is: Joi.string().valid(kFileBackendType.S3),
      then: Joi.object<S3FilePersistenceProviderInitParams>().keys({
        accessKeyId: Joi.string()
          .alphanum()
          .length(validationConstants.awsAccessKeyIdLength)
          .required(),
        secretAccessKey: Joi.string()
          .regex(ValidationRegExPatterns.awsSecretAccessKey)
          .length(validationConstants.awsSecretAccessKeyLength)
          .required(),
        region: Joi.string().valid(kFileBackendConstants.awsRegions).required(),
      }),
    },
    {otherwise: Joi.forbidden()},
  ],
});

const fileBackendValidationSchemas = {backend, credentials, nonFimidaraBackend};

export default fileBackendValidationSchemas;
