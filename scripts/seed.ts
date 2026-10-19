import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME;
if (!TABLE) throw new Error('Falta TABLE_NAME');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const fish = [
    { id: 1, name: 'Pez payaso', scientific_name: 'Amphiprion ocellaris', family: 'Pomacentridae', water_type: 'salada', habitat: 'arrecife', max_length_cm: 11 },
    { id: 2, name: 'Pez betta', scientific_name: 'Betta splendens', family: 'Osphronemidae', water_type: 'dulce', habitat: 'arrozal', max_length_cm: 7 },
    { id: 3, name: 'Tiburón ballena', scientific_name: 'Rhincodon typus', family: 'Rhincodontidae', water_type: 'salada', habitat: 'mar abierto', max_length_cm: 1800 },
    { id: 4, name: 'Pez ángel', scientific_name: 'Pterophyllum scalare', family: 'Cichlidae', water_type: 'dulce', habitat: 'rio', max_length_cm: 15 },
    { id: 5, name: 'Pez cirujano azul', scientific_name: 'Paracanthurus hepatus', family: 'Acanthuridae', water_type: 'salada', habitat: 'arrecife', max_length_cm: 31 },
    { id: 6, name: 'Piraña roja', scientific_name: 'Pygocentrus nattereri', family: 'Serrasalmidae', water_type: 'dulce', habitat: 'rio', max_length_cm: 33 },
    { id: 7, name: 'Pejerrey', scientific_name: 'Odontesthes bonariensis', family: 'Atherinopsidae', water_type: 'dulce', habitat: 'laguna', max_length_cm: 50 },
    { id: 8, name: 'Dorado', scientific_name: 'Salminus brasiliensis', family: 'Bryconidae', water_type: 'dulce', habitat: 'rio', max_length_cm: 100 },
];

async function main() {
    await db.send(
        new BatchWriteCommand({
            RequestItems: { [TABLE!]: fish.map((Item) => ({ PutRequest: { Item } })) },
        }),
    );
    console.log(`Cargados ${fish.length} peces`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});