#!/bin/bash
if [ "$PYTHONPATH" = "" ]; then
    export PYTHONPATH="$PWD"
fi
cd ../oq-platform-standalone
./runserver.sh
