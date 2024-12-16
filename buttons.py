from gpiozero import Button
import signal 
import json
import urllib.request as ureq


URL = "http://192.168.1.71:6680/mopidy/rpc"


def rpc(method, params=None):
    print("Executing ", method)
    msg = {
        "jsonrpc": "2.0", "id": 1, "method": method
    }
    if params is not None:
        msg["params"] = params
    msg = json.dumps(msg).encode("utf-8")
    req = ureq.Request(URL)
    req.add_header('Content-Type', 'application/json')
    response = ureq.urlopen(req, msg)
    return json.loads(response.read())["result"]


def play():
    resp = rpc("core.playback.play")
    print(resp)


def pause():
    resp = rpc("core.playback.pause")
    print(resp)


def toggle_play():
    print("Toggle play")
    resp = rpc("core.playback.get_state")
    print(resp)
    if resp == "paused":
        play()
    else:
        pause()


def next():
    print("Next")
    resp = rpc("core.playback.next")

    
def previous():
    print("Previous")
    resp = rpc("core.playback.previous")


def record():
    print("Record")


def change_volume(amount):
    prev_volume = int(rpc("core.mixer.get_volume"))
    new_volume = prev_volume + amount
    new_volume = max(0, min(100, new_volume))
    rpc("core.mixer.set_volume", {"volume": new_volume})


def vol_up():
    print("Volume up")
    change_volume(10)


def vol_down():
    print("Volume down")
    change_volume(-10)


button_play = Button(10)
button_play.when_pressed = toggle_play

button_next = Button(27)
button_next.when_pressed = next

button_prev = Button(21)
button_prev.when_pressed = previous
    
button_vol_up = Button(3)
button_vol_up.when_pressed = vol_up

button_vol_down = Button(15)
button_vol_down.when_pressed = vol_down

button_record = Button(16)
button_record.when_pressed = record

print("Waiting for signal")
signal.pause() # wait for a signal
 
