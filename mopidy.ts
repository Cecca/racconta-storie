const URL = "http://192.168.1.71:6680/mopidy/rpc"

async function rpc(method, params) {
  const resp = await fetch(URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "jsonrpc": "2.0", "id": 1, 
      "method": method,
      "params": params
    })
  });
  return resp.json()
}

async function playback_interaction(what) {
  const bod = JSON.stringify({
      "jsonrpc": "2.0", "id": 1, "method": "core.playback." + what
    });
    console.log(bod);
  return await fetch(URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: bod
  });
}

async function playback_stop() {
  return playback_interaction("stop")
}

async function playback_play() {
  return playback_interaction("play")
}

async function spotify_playlists() {
  return await fetch(URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "jsonrpc": "2.0", "id": 1, 
      "method": "core.playlists.as_list"
    })
  });
}

async function tracklist_clear() {
  return await fetch(URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "jsonrpc": "2.0", "id": 1, 
      "method": "core.tracklist.clear"
    })
  });
}

async function tracklist_add(uri) {
  let uris = [];
  if (uri.startsWith("m3u")) {
    const resp = await rpc("core.playlists.get_items", [uri]);
    const res = resp.result;
    for (const ans in res) {
      uris.push(res[ans].uri);
    }
  } else {
    uris.push(uri);
  }
  console.log(uris)
  return await fetch(URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "jsonrpc": "2.0", "id": 1, 
      "method": "core.tracklist.add",
      "params": {
        "uris": uris
      }
    })
  });
}

async function tracklist_replace(uri) {
  console.log("replacing playlist");
  await tracklist_clear();
  const resp = await tracklist_add(uri);
  console.log(await resp.json());
}


async function main() {
  const resp = await spotify_playlists();
  console.log(await resp.json());

  // tracklist_replace("spotify:playlist:6xTlGGHLMSJIkkdAGmIgOE");
  await tracklist_replace("m3u:Favole_al_telefono.m3u8");
  // await tracklist_replace("local:track:Favole_al_telefono_1.mp3");
  playback_play();
}

main();
