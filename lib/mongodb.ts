import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI as string | undefined;

if (!uri) {
  console.warn("MONGODB_URI is not set. API routes depending on MongoDB will fail.");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined = global._mongoClientPromise;

if (!clientPromise && uri) {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    throw new Error("MONGODB_URI is not configured.");
  }
  return clientPromise;
}

export function getDbName(): string {
  return process.env.MONGODB_DB || "ai_bookmark";
}


