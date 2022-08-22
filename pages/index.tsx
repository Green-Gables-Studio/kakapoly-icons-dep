import type { NextPage } from "next";

export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/icon-sets",
      permanent: false,
      locale: false,
    },
  };
}

const Home: NextPage = () => {
  return null;
};

export default Home;
