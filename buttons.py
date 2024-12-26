from gpiozero import Button
import signal 
import json
import urllib.request as ureq
import subprocess as sp
import os
import time
import datetime


URL = "http://localhost:6680/mopidy/rpc"
STATE_FILE = os.path.expanduser("~/.state")
PLAYER_PROCESS = None
RECORD_PROCESS = None


def get_state():
    with open(STATE_FILE) as fp:
        state = fp.read()
        return state


def set_state(state):
    with open(STATE_FILE, "w") as fp:
        fp.write(state)


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


def stop():
    rpc("core.playback.stop")



def toggle_play():
    print("Toggle play")
    state = get_state()
    if state == "mopidy":
        resp = rpc("core.playback.get_state")
        print(resp)
        if resp == "paused":
            play()
        else:
            pause()
    elif state == "record":
        print("play recording")
        all_recordings = os.listdir(os.path.expanduser("~/recordings/"))
        all_recordings.sort()
        last_recording = os.path.join(
            os.path.expanduser("~/recordings"),
            all_recordings[-1]
        )
        global PLAYER_PROCESS
        global RECORD_PROCESS
        if RECORD_PROCESS is not None:
            RECORD_PROCESS.kill()
            RECORD_PROCESS = None
        if PLAYER_PROCESS is not None:
            PLAYER_PROCESS.kill()
            PLAYER_PROCESS = None
            return

        PLAYER_PROCESS = sp.Popen([
            "aplay", last_recording
        ])

    else:
        print("nothing to do")
        pass # do nothing


def next():
    print("Next")
    resp = rpc("core.playback.next")

    
def previous():
    print("Previous")
    resp = rpc("core.playback.previous")


def get_recording_device():
    proc = sp.run(["arecord", "-l"], capture_output=True)
    out = proc.stdout.decode()
    for line in out.splitlines():
        if line.startswith("card"):
            tokens = line.split()
            num = tokens[1].replace(":", "")
            return "hw:{},0".format(num)


def record():
    print("Record")
    global RECORD_PROCESS
    global PLAYER_PROCESS
    if PLAYER_PROCESS is not None:
        PLAYER_PROCESS.kill()
        PLAYER_PROCESS = None
    if RECORD_PROCESS is not None:
        print("killing recorder")
        RECORD_PROCESS.kill()
        RECORD_PROCESS = None
        return
    # No recording in progress
    stop() # Stop mopidy playback

    set_state("record")
    fname = os.path.expanduser("~/recordings/{}.wav".format(
        datetime.datetime.now().isoformat()
    ))
    timeout = 60 * 10 # Record at most 10 minutes
    print("Start record process")
    RECORD_PROCESS = sp.Popen(
        ["arecord", 
         "-D", get_recording_device(), # "hw:1,0", 
         "-f", "S16_LE", 
         "-r", "44100",
         "--duration", str(timeout),
         fname]
    )


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


def is_active():
    resp = rpc("core.playback.get_state")
    mopidy_active = resp != "stopped" and resp != "paused"
    recorder_active = RECORD_PROCESS is not None 
    record_player_active = PLAYER_PROCESS is not None 
    return mopidy_active or recorder_active or record_player_active


def main():
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

    button_record = Button(16, bounce_time=0.05)
    button_record.when_pressed = record

    print("Waiting for signal")
    signal.pause() # wait for a signal
     


if __name__ == "__main__":
    main()
