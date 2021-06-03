import {ITransformerParameterValue} from './transformers';

export interface IBucketTransformerTransform {
    params: ITransformerParameterValue[];
    transformId: string;
    name: string;
    description?: string;
    createdAt: string;
    createdBy: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
}

export interface IBucketTransformerMapping {
    mimetype: string;
    transformerId: string;
}

export interface IBucket {
    bucketId: string;
    organizationId: string;
    environmentId: string;
    projectId: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
    transforms: IBucketTransformerTransform[];
    transformerMappings: IBucketTransformerMapping[];
}
