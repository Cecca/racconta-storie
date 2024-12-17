import { Database } from "jsr:@db/sqlite@0.12";
import { PageProps } from "$fresh/server.ts";

export default function Associate(props: PageProps) {
  console.log(props);
  const url = new URL(props.url);
  const mopidy_uri = url.searchParams.get("uri") || "";
  const key = url.searchParams.get("key") || "";
  console.log(mopidy_uri);
  console.log(key);

  const db = new Database("raccontastorie.db");
  db.prepare(`
      INSERT INTO cards (card_id, mopidy_uri)
      VALUES (?, ?);
  `).run(key, mopidy_uri);
  
  return (
    <p>ciao</p>
  );
}
