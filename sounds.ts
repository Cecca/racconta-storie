import { Database } from "jsr:@db/sqlite@0.12";
import { TextLineStream } from "jsr:@std/streams";

const globalState = {};

// Setup the database
const db = new Database("test.db");
db.prepare(
  `
	CREATE TABLE IF NOT EXISTS audiofiles (
	  key TEXT PRIMARY KEY,
	  title TEXT,
	  path TEXT
	);
  `,
).run();

// db.prepare(
//   `
// 	INSERT INTO audiofiles (key, title, path) VALUES (?, ?, ?);
//   `,
// ).run("0014437885", "Favole al telefono", "audio/2724044.mp3");

function playAudio(path: string) {
  return new Deno.Command("mpv", {args: [path]}).spawn();
}

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

async function playFromCards(path: string) {
  for await (const key of keyStream(path)) {
    const rows = db.prepare(
      `
        SELECT key, title, path FROM audiofiles
        WHERE key = ?;
      `
    ).all(key);

    if (rows.length > 0) {
      const entry = rows[0];
      if ("currentPlay" in globalState) {
        console.log("stop previous play");
        await globalState["currentPlay"].kill();
      }

      console.log("playing " + entry["title"]);
      const handle = playAudio(entry["path"]);
      globalState["currentPlay"] = handle;
    } else {
      console.warn("missing entry for key " + key);
    }
  }
}

if (import.meta.main) {
  let kbd = "/dev/input/by-id/usb-HXGCoLtd_27db-event-kbd";

  await playFromCards(kbd);

}
