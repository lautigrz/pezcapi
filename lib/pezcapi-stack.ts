import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class PezcapiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fishTable = new dynamodb.Table(this, 'FishTable', {
      tableName: 'fish',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });


    fishTable.addGlobalSecondaryIndex({
      indexName: 'byWaterType',
      partitionKey: { name: 'water_type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.NUMBER }
    });


    fishTable.addGlobalSecondaryIndex({
      indexName: 'byHabitat',
      partitionKey: { name: 'habitat', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING }
    })
    const fishFn = new NodejsFunction(this, 'FishFn', {
      entry: 'src/handlers/fish.ts',
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: { 'TABLE_NAME': fishTable.tableName },
    });

    fishTable.grantReadWriteData(fishFn);

    new cdk.CfnOutput(this, 'FishTableName', { value: fishTable.tableName });

    const api = new apigw.RestApi(this, 'PezcapiApi', { restApiName: 'pezcapi' });
    const integration = new apigw.LambdaIntegration(fishFn);

    const fishRes = api.root.addResource('fish');
    fishRes.addMethod('GET', integration);
    fishRes.addResource('{id}').addMethod('GET', integration);
  }
}