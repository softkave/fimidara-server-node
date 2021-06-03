export enum TransformerParamType {
    Number = 'number',
}

export interface ITransformerParameter {
    paramName: string;
    paramType: TransformerParamType;
    defaultValue?: number;
}

export interface ITransformer {
    transformerId: string;
    name: string;
    description?: string;
    params: ITransformerParameter[];
}

export interface ITransformerParameterValue extends ITransformerParameter {
    paramValue: number;
}
