export default function dumpEnvironment() {
  return { ...process.env, MYSQL_PWD: "", MARIADB_PWD: "" };
}
