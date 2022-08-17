import {
  toTypedRxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxJsonSchema,
  RxCollection,
} from "rxdb";
import { IconSetDocType } from "./icon-set";

const iconSchemaLiteral = {
  title: "icon",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have set maxLength
    },
    name: {
      type: "string",
    },
    iconSet: {
      type: "string",
      ref: "iconSets",
    },
    svg: {
      type: "string",
    },
  },
  required: ["id"],
} as const;

const iconSchemaTyped = toTypedRxJsonSchema(iconSchemaLiteral);

export type IconDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof iconSchemaTyped
>;

export type IconCollection = RxCollection<IconDocType, {}, {}>;

const iconSchema: RxJsonSchema<IconDocType> = iconSchemaLiteral;

export default iconSchema;
