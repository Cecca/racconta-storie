import { Database } from "jsr:@db/sqlite@0.12";
import { playback_play, tracklist_replace } from "./mopidy.ts";

// Setup the database
const db = new Database("raccontastorie.db");
db.prepare(
  `
	CREATE TABLE IF NOT EXISTS cards (
	  card_id TEXT PRIMARY KEY,
	  mopidy_uri TEXT
	);
`).run();

db.prepare(`
	CREATE TABLE IF NOT EXISTS last_card (
	  rowid INT PRIMARY KEY,
	  last_card TEXT
	);
  `,
).run();


class InputEvent {
  seconds: number;
  microseconds: number;
  type_: number
  code: number;
  value: number;

  constructor(buffer: Uint8Array) {
    if (buffer.byteLength != 24) {
      throw new Error("buffer of the wrong size");
    }
    // Allocate memory for the struct
    const ptr = Deno.UnsafePointer.of(buffer);
    // Create a view of the memory
    const view = new Deno.UnsafePointerView(ptr);

    // Parse the fields
    this.seconds = view.getBigInt64(0, true);        // 8 bytes for seconds
    this.microseconds = view.getBigInt64(8, true);  // 8 bytes for microseconds
    this.type_ = view.getUint16(16, true);           // 2 bytes for type
    this.code = view.getUint16(18, true);           // 2 bytes for code
    this.value = view.getInt32(20, true);   
  }
}

const DEVICE_KEYS = [
    'X', '^', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'X', 'X', 'X', 'X', 'q', 'w', 'e',
    'r', 't', 'z', 'u', 'i', 'o', 'p', 'X', 'X', 'X', 'X', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k',
    'l', 'X', 'X', 'X', 'X', 'X', 'y', 'x', 'c', 'v', 'b', 'n', 'm', 'X', 'X', 'X', 'X', 'X', 'X',
    'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
];

async function *keyStream(path: string) {
  using file = await Deno.open(path);
  const buf = new Uint8Array(24); // Buffer of the size of hold a single input event
  let s = "";
  while (true) {
    const read = await file.read(buf);
    const ev = new InputEvent(buf);
    if (ev.type_ == 1 && ev.value == 1) {
      if (ev.code == 28) {
        // this is "enter"
        const retval = s;
        s = "";
        yield retval;
      } else {
        s += DEVICE_KEYS[ev.code];
      }
    }
  }
}

export async function readCards(path: string) {
  for await (const key of keyStream(path)) {
    const rows = db.prepare(
      `
        SELECT card_id, mopidy_uri FROM cards
        WHERE card_id = ?;
      `
    ).all(key);

    if (rows.length > 0) {
      const entry = rows[0];
      await tracklist_replace(entry["mopidy_uri"]);
      await playback_play();
    } else {
      console.warn("missing entry for key " + key);
      db.prepare(`
         INSERT OR REPLACE INTO last_card (rowid, last_card)
         VALUES (0, ?)
      `).run(key);
    }
  }
}

if (import.meta.main) {
  let kbd = "/dev/input/by-id/usb-HXGCoLtd_27db-event-kbd";

  await readCards(kbd);

}
