import {
  toTypedRxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxJsonSchema,
  RxCollection,
} from "rxdb";
import { IconDocType } from "./icon";

const iconSetSchemaLiteral = {
  title: "icon-set",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    slug: {
      type: "string",
    },
    projectUrl: {
      type: "string",
    },
    figmaFileUrl: {
      type: "string",
    },
    currentVersion: {
      type: "string",
    },
    icons: {
      type: "array",
      ref: "icons",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "id",
    "name",
    "slug",
    "projectUrl",
    "figmaFileUrl",
    "currentVersion",
    "icons",
  ],
  // indexes: ['name']
} as const;

const iconSetSchemaTyped = toTypedRxJsonSchema(iconSetSchemaLiteral);

export type IconSetDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof iconSetSchemaTyped
>;

export type IconSetCollection = RxCollection<IconSetDocType, {}, {}>;

const iconSetSchema: RxJsonSchema<IconSetDocType> = iconSetSchemaLiteral;

export default iconSetSchema;
