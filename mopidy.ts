const URL = "http://192.168.1.71:6680/mopidy/rpc"

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
  return await fetch(URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "jsonrpc": "2.0", "id": 1, 
      "method": "core.tracklist.add",
      "params": {
        "uris": [uri]
      }
    })
  });
}

async function tracklist_replace(uri) {
  await tracklist_clear();
  await tracklist_add(uri);
}


async function main() {
  const resp = await spotify_playlists();
  console.log(await resp.json());

  // tracklist_replace("spotify:playlist:6xTlGGHLMSJIkkdAGmIgOE");
  // playback_play();
}

main();
