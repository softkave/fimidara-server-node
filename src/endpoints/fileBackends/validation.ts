import Joi from 'joi';
import {FileBackendTypeMap} from '../../definitions/fileBackend';
import {S3FilePersistenceProviderInitParams} from '../contexts/file/S3FilePersistenceProvider';

const awsRegions = [
  'us-east-2',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-east-1',
  'ap-south-2',
  'ap-southeast-3',
  'ap-southeast-4',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-south-1',
  'eu-west-3',
  'eu-south-2',
  'eu-north-1',
  'eu-central-2',
  'il-central-1',
  'me-south-1',
  'me-central-1',
  'sa-east-1',
];

const awsSecretAccessKeyRegex = /^[A-Za-z0-9+/]$/;

const backend = Joi.string().valid(Object.values(FileBackendTypeMap));
const nonFimidaraBackend = Joi.string().valid(
  Object.values(FileBackendTypeMap).filter(backend => backend !== 'fimidara')
);
const credentials = Joi.object().when('backend', {
  switch: [
    {
      is: Joi.string().valid(FileBackendTypeMap.S3),
      then: Joi.object<S3FilePersistenceProviderInitParams>().keys({
        accessKeyId: Joi.string().alphanum().length(20).required(),
        secretAccessKey: Joi.string()
          .regex(awsSecretAccessKeyRegex)
          .length(40)
          .required(),
        region: Joi.string().valid(awsRegions).required(),
      }),
    },
    {otherwise: Joi.forbidden()},
  ],
});

const fileBackendValidationSchemas = {backend, credentials, nonFimidaraBackend};

export default fileBackendValidationSchemas;
