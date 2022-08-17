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

type IconSet = {
  icons: {
    id: string;
    name?: string | undefined;
    svg?: string | undefined;
  }[];
  id?: string | undefined;
  slug?: string | undefined;
  name?: string | undefined;
  projectUrl?: string | undefined;
  figmaFileUrl?: string | undefined;
  currentVersion?: string | undefined;
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { locale, params } = context;
  const { slug } = params as { slug: string };

  const db = await Database.get()!;

  await db.iconSets.bulkInsert(iconSetsDump.docs ?? []);
  await db.icons.bulkInsert(iconsDump.docs ?? []);

  const iconSetdocument = await db.iconSets
    .findOne()
    .where("slug")
    .eq(slug)
    .exec();

  const icons: RxDocument<IconDocType>[] = await iconSetdocument?.populate(
    "icons"
  );

  const iconSet: IconSet = {
    ...iconSetdocument?.toJSON(),
    icons: icons.map((icon) => {
      const { iconSet, ...rest } = icon.toJSON();
      return rest;
    }),
  };

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "", ["common"])),
      iconSet,
    },
  };
};

export async function getStaticPaths() {
  const paths = iconSetsDump.docs.map((iconSetDocument) => {
    return {
      params: {
        slug: iconSetDocument.slug,
      },
    };
  });

  return {
    paths,
    fallback: false, // can also be true or 'blocking'
  };
}

const IconSet: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
  props
) => {
  const { iconSet } = props;
  const { t } = useTranslation("common");

  return <div>Hello world, {iconSet.name}</div>;
};

export default IconSet;
