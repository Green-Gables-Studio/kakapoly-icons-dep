import type {
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import Image from "next/image";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import iconSetsDump from "../../database/dump/collections/iconSets.json";
import iconsDump from "../../database/dump/collections/icons.json";
import Database from "../../database/database";
import { RxDocument } from "rxdb";
import { IconCollection, IconDocType } from "../../database/schema/icon";
import { IconSets } from "../../types";

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const db = await Database.get()!;

  await db.iconSets.bulkInsert(iconSetsDump.docs ?? []);
  await db.icons.bulkInsert(iconsDump.docs ?? []);

  const iconSets: IconSets = [];

  const iconSetDocuments = await db.iconSets.find().exec();
  for (const iconSetDocument of iconSetDocuments) {
    const icons: RxDocument<IconDocType>[] = await iconSetDocument.populate(
      "icons"
    );
    const { icons: _icons, ...rest } = iconSetDocument.toJSON();
    iconSets.push({
      ...rest,
      icons: icons.map((icon) => {
        const { iconSet, ...rest } = icon.toJSON();
        return rest;
      }),
    });
  }

  const { locale, params } = context;

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "", ["common"])),
      iconSets,
    },
  };
};

const IconSets: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
  props
) => {
  const { iconSets } = props;
  const { t } = useTranslation("common");

  return <div>Hello world</div>;
};

export default IconSets;
