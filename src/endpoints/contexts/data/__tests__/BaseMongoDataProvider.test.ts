import {faker} from '@faker-js/faker';
import {Schema, SchemaDefinition, SchemaTypes} from 'mongoose';
import {MongoDbConnection} from '../../../../db/connection';
import {CombinationToken, combineTokens} from '../../../../utils/combineTokens';
import {loopAndCollate} from '../../../../utils/fns';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {kUtilsInjectables} from '../../injection/injectables';
import {
  BaseMongoTestData,
  generateBaseMongoTestDataFromCombination,
  generateBaseMongoTestQueryFromCombination,
  kBaseMongoTestConsts,
} from './utils';

const kModelName = 'BaseMongoDataProvider-' + faker.lorem.word();
const kCollectionName = kModelName + '-' + 'collection';
const kSchema: SchemaDefinition<BaseMongoTestData> = {
  num: {type: Number},
  str: {type: String},
  arrPrimitive: {type: [String]},
  arrObj: {type: [SchemaTypes.Map]},
  obj: {type: SchemaTypes.Map},
};
const kMongoSchema = new Schema(kSchema);

function getConnection() {
  return (kUtilsInjectables.dbConnection() as MongoDbConnection).get();
}

function getModel() {
  return getConnection().model(kModelName, kMongoSchema, kCollectionName);
}

beforeAll(async () => {
  initTests();
});

afterEach(async () => {
  const connection = getConnection();
  await connection.dropCollection(kCollectionName);
});

afterAll(async () => {
  await completeTests();
});

async function testArrDepth(tokens: CombinationToken[]) {
  const maxData = 10;
  const model = getModel();
  const combinations = combineTokens(tokens, kBaseMongoTestConsts.max);
  const data = loopAndCollate(
    () => generateBaseMongoTestDataFromCombination(combinations),
    maxData
  );
  const query = generateBaseMongoTestQueryFromCombination({
    combinations,
  });
  await model.insertMany(data);

  const result = await model.find(query);

  expect(result.length).toBe(maxData);
}

describe('BaseMongoDataProvider', () => {
  test('array depth 01', async () => {
    await testArrDepth(kBaseMongoTestConsts.tokensArrDepth01);
  });

  test('array depth 02', async () => {
    await testArrDepth(kBaseMongoTestConsts.tokensArrDepth02);
  });

  test('array depth 03', async () => {
    await testArrDepth(kBaseMongoTestConsts.tokensArrDepth03);
  });
});
