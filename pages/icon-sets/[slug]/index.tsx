import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import iconSetsDump from "../../../database/dump/collections/iconSets.json";
import iconsDump from "../../../database/dump/collections/icons.json";
import Database from "../../../database/database";
import { RxDocument } from "rxdb";
import { IconDocType } from "../../../database/schema/icon";
import { IconSet } from "../../../types";
import Link from "next/link";
import { useRouter } from "next/router";
import parse, {
  Element,
  attributesToProps,
  domToReact,
} from "html-react-parser";
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths =
    locales?.reduce<
      Array<{
        params: {
          slug: string;
        };
        locale: string;
      }>
    >((pv, cv) => {
      return [
        ...pv,
        ...iconSetsDump.docs.map((iconSetDocument) => {
          return {
            params: {
              slug: iconSetDocument.slug,
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

  const iconSet: IconSet | null = iconSetdocument
    ? {
        ...iconSetdocument.toJSON(),
        icons: icons.map((icon) => {
          const { iconSet, ...rest } = icon.toJSON();
          return rest;
        }),
      }
    : null;

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "", ["common"])),
      iconSet,
    },
  };
};

const IconSet: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
  props
) => {
  const { iconSet } = props;
  const { t } = useTranslation("common");

  const router = useRouter();
  const { pathname, asPath, query, locale } = router;

  const [searchQuery, setSearchQuery] = useState("");

  const [icons, setIcons] = useState(iconSet?.icons ?? []);

  const fuse = useMemo(() => {
    return new Fuse(iconSet?.icons ?? [], {
      // includeScore: true,
      keys: ["name"],
    });
  }, [iconSet?.icons]);

  useEffect(() => {
    if (!searchQuery) {
      setIcons(iconSet?.icons ?? []);
      return;
    }

    const results = fuse.search(searchQuery);
    setIcons(results.map((result) => result.item));
  }, [fuse, iconSet?.icons, searchQuery]);

  if (!iconSet) {
    return null;
  }

  const selectedIcon = iconSet.icons.find(
    (icon) => icon.id === router.query.iconId
  );

  return (
    <>
      <Dialog
        open={Boolean(router.query.iconId)}
        onClose={() => {
          router.push(`/icon-sets/${iconSet.slug}`, undefined, {
            scroll: false,
          });
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded bg-white border border-solid p-4">
            {selectedIcon && (
              <>
                <div>
                  {parse(selectedIcon.svg, {
                    replace: (domNode) => {
                      if (
                        domNode instanceof Element &&
                        domNode.name === "svg"
                      ) {
                        const { width, height, ...restAttribs } =
                          domNode.attribs;
                        const props = attributesToProps({
                          ...restAttribs,
                        });
                        return (
                          <svg {...props}>{domToReact(domNode.children)}</svg>
                        );
                      }
                    },
                  })}
                </div>
                <br />
                <div>{selectedIcon.name}</div>
                <div>
                  in{" "}
                  <Link href={`/icon-sets/${iconSet.slug}`}>
                    <a className="underline">{iconSet.name}</a>
                  </Link>
                </div>
                <br />
                <button
                  className="border border-solid p-2"
                  onClick={() => {
                    const blob = new Blob([selectedIcon.svg], {
                      type: "text/plain;charset=utf-8",
                    });
                    saveAs(blob, `${selectedIcon.name}.svg`);
                  }}
                >
                  Download SVG
                </button>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
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
          <section className="p-8 flex justify-between items-center">
            <h1>
              <strong>{iconSet.name}</strong>
            </h1>

            <button
              className="border border-solid p-4 hover:bg-gray-100"
              onClick={async () => {
                const zip = new JSZip();
                iconSet.icons.forEach((icon) => {
                  zip.file(`${icon.name}.svg`, icon.svg);
                });

                const blob = await zip.generateAsync({ type: "blob" });

                saveAs(blob, `${iconSet.slug}.zip`);
              }}
            >
              Download Icons
            </button>
          </section>

          <section className="p-8">
            {/* TODO: Add view options
              - resize svg
              - hide icon name
              - roomy, compact, pill views
              */}
            <div className="flex justify-between">
              <div>
                {/* Filters */}
                <div>
                  <input
                    className="border border-solid p-2 w-96"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                    }}
                  />
                </div>
                <br />
                {/* TODO: Replace with a proper filter tags */}
                <div className="flex gap-2">
                  <button className="text-sm border border-solid p-2 bg-gray-100 hover:bg-gray-100">
                    Outlined
                  </button>

                  <button className="text-sm border border-solid p-2 hover:bg-gray-100">
                    Solid
                  </button>
                </div>
              </div>
            </div>

            <br />

            <div className="border border-solid p-4 h-[600px] overflow-y-scroll">
              <div className="grid grid-cols-12">
                {icons.map((icon) => {
                  return (
                    <Link
                      key={icon.id}
                      href={`/icon-sets/[slug]/?iconId=${icon.id}&slug=${iconSet.slug}`}
                      as={`/icons/${icon.id}`}
                      scroll={false}
                    >
                      <a className="aspect-square hover:bg-gray-100">
                        <div className="p-4 inline-flex flex-col items-center justify-center gap-y-2 w-full h-full ">
                          <div className="w-6 h-6">
                            {parse(icon.svg, {
                              replace: (domNode) => {
                                if (
                                  domNode instanceof Element &&
                                  domNode.name === "svg"
                                ) {
                                  const { width, height, ...restAttribs } =
                                    domNode.attribs;
                                  const props = attributesToProps({
                                    ...restAttribs,
                                  });
                                  return (
                                    <svg {...props}>
                                      {domToReact(domNode.children)}
                                    </svg>
                                  );
                                }
                              },
                            })}
                          </div>
                          <div className="text-xs">{icon.name}</div>
                        </div>
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="p-8">
            <div>
              <h2>
                <strong>Version</strong>
              </h2>
              <div>{iconSet.currentVersion}</div>
            </div>

            <br />

            <div>
              <h2>
                <strong>Design</strong>
              </h2>

              {iconSet.figmaFileUrl && (
                <a href={iconSet.figmaFileUrl} target="_blank" rel="noreferrer">
                  {iconSet.figmaFileUrl}
                </a>
              )}
            </div>

            <br />

            <div>
              <h2>
                <strong>Project</strong>
              </h2>

              {iconSet.projectUrl && (
                <a href={iconSet.projectUrl} target="_blank" rel="noreferrer">
                  {iconSet.projectUrl}
                </a>
              )}
            </div>

            <br />

            <div>
              <h2>
                <strong>Share</strong>
              </h2>
              <button className="border border-solid p-2 hover:bg-gray-100">
                Copy URL
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default IconSet;
