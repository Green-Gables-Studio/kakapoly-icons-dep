import { addRxPlugin, createRxDatabase, RxCollection, RxDatabase } from "rxdb";
import {
  getRxStorageMemory,
  MemoryStorageInternals,
  RxStorageMemoryInstanceCreationOptions,
} from "rxdb/plugins/memory";
import iconSchema, { IconCollection } from "./schema/icon";
import iconSetSchema, { IconSetCollection } from "./schema/icon-set";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBJsonDumpPlugin } from "rxdb/plugins/json-dump";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";

type Collections = {
  iconSets: IconSetCollection;
  icons: IconCollection;
};

type Database = RxDatabase<
  Collections,
  MemoryStorageInternals<any>,
  RxStorageMemoryInstanceCreationOptions
>;

type CreatePromise = Promise<Database>;

const Database: {
  get: () => CreatePromise | null;
} = {
  get: () => null,
};

async function create() {
  addRxPlugin(RxDBJsonDumpPlugin);
  addRxPlugin(RxDBUpdatePlugin);
  addRxPlugin(RxDBQueryBuilderPlugin);

  const database = await createRxDatabase<Database>({
    name: "kakapoly-icons",
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  });
  await database.addCollections({
    iconSets: {
      schema: iconSetSchema,
    },
    icons: {
      schema: iconSchema,
    },
  });

  return database;
}

let createPromise: CreatePromise | null = null;

Database.get = async () => {
  if (!createPromise) {
    createPromise = create();
  }
  return createPromise;
};

export default Database;
