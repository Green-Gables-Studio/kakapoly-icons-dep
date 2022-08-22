import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Database from "../../../database/database";
import iconSetsDump from "../../../database/dump/collections/iconSets.json";
import iconsDump from "../../../database/dump/collections/icons.json";
import { RxDocument } from "rxdb";
import { IconSetDocType } from "../../../database/schema/icon-set";
import { Icon } from "../../../types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import parse, {
  Element,
  attributesToProps,
  domToReact,
} from "html-react-parser";
import { saveAs } from "file-saver";

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths =
    locales?.reduce<
      Array<{
        params: {
          iconId: string;
        };
        locale: string;
      }>
    >((pv, cv) => {
      return [
        ...pv,
        ...iconsDump.docs.map((iconDocument) => {
          return {
            params: {
              iconId: iconDocument.id,
            },
            locale: cv,
          };
        }),
      ];
    }, []) ?? [];

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { locale, params } = context;
  const { iconId } = params as { iconId: string };

  const db = await Database.get()!;

  await db.iconSets.bulkInsert(iconSetsDump.docs ?? []);
  await db.icons.bulkInsert(iconsDump.docs ?? []);

  const iconDocument = await db.icons.findOne().where("id").eq(iconId).exec();

  const iconSet: RxDocument<IconSetDocType> = await iconDocument?.populate(
    "iconSet"
  );

  const icon: Icon | null = iconDocument
    ? {
        ...iconDocument.toJSON(),
        iconSet: iconSet.toJSON(),
      }
    : null;

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "", ["common"])),
      icon,
    },
  };
};

const Icon: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
  props
) => {
  const { icon } = props;
  const { t } = useTranslation("common");

  const router = useRouter();
  const { pathname, asPath, query, locale } = router;

  if (!icon) {
    return null;
  }

  return (
    <div>
      <header className="border border-solid">
        <nav className="px-8 flex justify-between items-center h-20">
          <div>
            <Link href="/">
              <a>Kakapoly Icons</a>
            </Link>
          </div>
          <div className="flex gap-x-10">
            <ul>
              <li>
                <Link href="/icon-sets">
                  <a>Icon Sets</a>
                </Link>
              </li>
            </ul>
            <select
              value={locale}
              onChange={(event) => {
                const { value } = event.target;
                router.push({ pathname, query }, asPath, { locale: value });
              }}
            >
              <option value="en">EN</option>
              <option value="ko">KO</option>
            </select>
          </div>
        </nav>
      </header>
      <main>
        <section className="max-w-lg border border-solid p-4 ">
          <div>
            {parse(icon.svg, {
              replace: (domNode) => {
                if (domNode instanceof Element && domNode.name === "svg") {
                  const { width, height, ...restAttribs } = domNode.attribs;
                  const props = attributesToProps({
                    ...restAttribs,
                  });
                  return <svg {...props}>{domToReact(domNode.children)}</svg>;
                }
              },
            })}
          </div>
          <br />
          <div>{icon.name}</div>
          <div>
            in{" "}
            <Link href={`/icon-sets/${icon.iconSet.slug}`}>
              <a className="underline">{icon.iconSet.name}</a>
            </Link>
          </div>
          <br />
          <button
            className="border border-solid p-2"
            onClick={() => {
              const blob = new Blob([icon.svg], {
                type: "text/plain;charset=utf-8",
              });
              saveAs(blob, `${icon.name}.svg`);
            }}
          >
            Download SVG
          </button>
        </section>
      </main>
    </div>
  );
};

export default Icon;
