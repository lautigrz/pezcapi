import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';


const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME || 'fish';

const json = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});


const encode = (key: unknown) => Buffer.from(JSON.stringify(key)).toString('base64url');
const decode = (b: string) => JSON.parse(Buffer.from(b, 'base64url').toString('utf-8'));

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const id = event.pathParameters?.id;

        if (id) {
            const n = Number(id);

            if (!Number.isInteger(n)) return json(400, { error: 'id invalido' })

            const { Item } = await db.send(new GetCommand({ TableName: TABLE, Key: { id: n } }));

            return Item ? json(200, Item) : json(404, { error: 'Pez no encontrado' })

        }


        const q = event.queryStringParameters || {};
        const limit = Math.min(Math.max(Number(q.limit) || 20, 1), 50)
        const startKey = q.next ? decode(q.next) : undefined;

        let result;
        if (q.water_type || q.habitat) {
            const useWater = !!q.water_type;
            result = await db.send(new QueryCommand({
                TableName: TABLE,
                IndexName: useWater ? 'byWaterType' : 'byHabitat',
                Limit: limit,
                ExclusiveStartKey: startKey,
                KeyConditionExpression: useWater ? 'water_type = :v' : 'habitat = :v',
                ...(useWater && q.habitat ? { FilterExpression: 'habitat = :h' } : {}),
                ExpressionAttributeValues: {
                    ':v': useWater ? q.water_type : q.habitat,
                    ...(useWater && q.habitat ? { ':h': q.habitat } : {})
                },
            }));

        } else {
            result = await db.send(new ScanCommand({
                TableName: TABLE,
                Limit: limit,
                ExclusiveStartKey: startKey,
            }));
        }

        const next = result.LastEvaluatedKey ? encode(result.LastEvaluatedKey) : undefined;

        return json(200, { items: result.Items, next });
    } catch (e) {
        console.error(e);
        return json(500, { error: 'Internal server error' });
    }
};