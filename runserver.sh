#!/bin/bash
export PYTHONPATH="$PWD/../oq-platform-standalone"
python ./manage.py runserver ipt-alone.gem.lan:8000
