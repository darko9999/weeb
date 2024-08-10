import fastifyCompress from "@fastify/compress";
import cors from '@fastify/cors';
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import fastify from "fastify";
import { FromSchema, JSONSchema } from "json-schema-to-ts";

const server = fastify({ logger: true }).withTypeProvider<JsonSchemaToTsProvider>()

const swaggerOptions: fastifySwagger.FastifyDynamicSwaggerOptions = {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: "My Title",
            description: "My Description.",
            version: "1.0.0",
        },
    },
};

await server.register(fastifySwagger, swaggerOptions)

const swaggerUiOptions: fastifySwaggerUi.FastifySwaggerUiOptions = {}
await server.register(fastifySwaggerUi, swaggerUiOptions)

await server.register(fastifyCompress, { threshold: 0 });

await server.register(cors, { origin: true })

const querySchema = {
    type: "object",
    properties: {
        id: { type: "number", nullable: true, minimum: 1, default: 4 }
    },
    additionalProperties: false,
} as const satisfies JSONSchema
const payloadSchema = {
    type: "object",
    required: ["username"],
    properties: {
        username: { type: "string" },
        password: { type: "string" },
    },
    additionalProperties: false,
} as const satisfies JSONSchema

type payload = FromSchema<typeof payloadSchema>;

server.get('/', async (request, reply) => {
    return reply.redirect("/ping")
})

server.get('/ping', async (request, reply) => {
    return reply.send(`p${"o".repeat(100000)}ng`)
})

server.post('/login',
    {
        schema: {
            querystring: querySchema,
            body: payloadSchema
        },
    },
    async (request, reply) => {

        const payload: payload = request.body;

        return reply.send(`id: ${request.query.id} username: ${payload.username}`)
    }
);

server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(server.swagger());
    console.log(`Server listening at ${address}`)
})