import type {
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import iconSetsDump from "../../database/dump/collections/iconSets.json";
import iconsDump from "../../database/dump/collections/icons.json";
import Database from "../../database/database";
import { RxDocument } from "rxdb";
import { IconDocType } from "../../database/schema/icon";
import { IconSets } from "../../types";
import Link from "next/link";
import { useRouter } from "next/router";
import parse, {
  Element,
  attributesToProps,
  domToReact,
} from "html-react-parser";

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
      icons: icons
        .map((icon) => {
          const { iconSet, ...rest } = icon.toJSON();
          return rest;
        })
        .slice(0, 9),
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

  const router = useRouter();
  const { pathname, asPath, query, locale } = router;

  // NOTE: Temporary line for testing multiple icon sets on the UI
  const dummyIconSets = [...iconSets, ...iconSets, ...iconSets, ...iconSets];

  return (
    <>
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
          <section className="p-8">
            <h1>Icon Sets</h1>
            <br />
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat
              quidem numquam odit? Vero reprehenderit distinctio facilis odio
              rerum ullam laudantium dignissimos cupiditate voluptates esse,
              assumenda deserunt, ex aliquid beatae atque?
            </p>
          </section>
          <section className="p-8 grid grid-cols-5 gap-6">
            {dummyIconSets.map(
              ({ id, slug, name, projectUrl, icons }, index) => {
                return (
                  <Link href={`/icon-sets/${slug}`} key={`${id}-${index}`}>
                    <a>
                      <div className="border border-solid p-8 hover:bg-gray-100 cursor-pointer">
                        <h2>{name}</h2>
                        <br />
                        <div className="aspect-square">
                          <div className=" grid grid-cols-[repeat(3,24px)] place-content-between w-full h-full">
                            {icons.slice(0, 9).map(({ id, name, svg }) => {
                              return (
                                <div key={id} className="w-6 h-6">
                                  {parse(svg, {
                                    replace: (domNode) => {
                                      if (
                                        domNode instanceof Element &&
                                        domNode.name === "svg"
                                      ) {
                                        const {
                                          width,
                                          height,
                                          ...restAttribs
                                        } = domNode.attribs;
                                        const props =
                                          attributesToProps(restAttribs);
                                        return (
                                          <svg {...props}>
                                            {domToReact(domNode.children)}
                                          </svg>
                                        );
                                      }
                                    },
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </a>
                  </Link>
                );
              }
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default IconSets;
