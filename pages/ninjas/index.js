import Link from "next/link";
import styles from "../../styles/Jobs.module.css";
export const getStaticProps = async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  const data = await res.json();
  return {
    props: {
      ninjas: data,
    },
  };
};

const Ninjas = ({ ninjas }) => {
  return (
    <div>
      <h1>All Ninja Devs</h1>
      {ninjas.map((ninja) => {
        return (
          <Link href={`/ninjas/${ninja.id}`} key={ninja.id}>
            <h3 className={styles.single}>{ninja.name}</h3>
          </Link>
        );
      })}
    </div>
  );
};

export default Ninjas;
