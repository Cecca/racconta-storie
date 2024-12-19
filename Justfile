deploy: deploy-services deploy-code

deploy-buttons:
    scp buttons.py pi@raspberrypi:buttons.py

deploy-services:
    scp services/* pi@raspberrypi:.config/systemd/user

deploy-code:
    rsync -r . pi@raspberrypi:racconta-storie/
