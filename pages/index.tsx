import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale } = context;

  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const destination = `${localePrefix}/icon-sets`;

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};

const Home: NextPage = () => {
  return null;
};

export default Home;
