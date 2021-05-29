import * as aws from 'aws-sdk';

aws.config.loadFromPath('./src/resources/aws-config.json');

export default aws;
