import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";
import { all_playlists } from "../mopidy.ts";
import { Database } from "jsr:@db/sqlite@0.12";

export function LastCard({last_card}) {

  return (
    <div>
      <p>Ultima tessera:</p>
      <p>{last_card}</p>
    </div>
  );
}

export function Playlists({key, playlists}) {
  console.log(key);
  return (
    <div>
      <h3>Playlist disponibili</h3>
      <ul>
        {playlists.map((pl) => {
          return (
            <li><a href={`/associate?uri=${pl.uri}&key=${key}`}>
              {pl.name}
            </a></li>
          );
        })}
      </ul>
    </div>
  );
}


export default async function Home() {
  const playlists = await all_playlists();
  const db = new Database("raccontastorie.db");
  const last_card = db.prepare(`SELECT last_card FROM last_card;`).all()[0].last_card;

  const associated_playlist = db.prepare(`SELECT mopidy_uri FROM cards WHERE card_id = ?`).all(last_card);
  if (associated_playlist.length > 0) {
      return (
      <div class="px-4 py-8 mx-auto bg-[#86efac]">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <h1 class="text-4xl font-bold">Racconta storie</h1>
        </div>

        <LastCard last_card={last_card} />
        <p>Già associata</p>
      </div>
    );
  } 

  const playlistProps = {
    playlists: playlists,
    key: last_card
  }

  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold">Racconta storie</h1>
      </div>

      <LastCard last_card={last_card} />
      <Playlists {...playlistProps} />
    </div>
  );
}
