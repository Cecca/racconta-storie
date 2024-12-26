import buttons
import time
import subprocess as sp
from datetime import datetime, timedelta


LAST_ACTIVE = datetime.now()
MAX_INACTIVE = timedelta(minutes=10)


def do_shutdown():
    print("shutting down")
    sp.run(["sudo", "shutdown", "-h", "now"])


while True:
    time.sleep(60)
    if buttons.is_active():
        LAST_ACTIVE = datetime.now()
    else:
        if datetime.now() - LAST_ACTIVE >= MAX_INACTIVE:
            do_shutdown()

