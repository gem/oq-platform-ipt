#!/bin/bash
if ! (echo "$PYTHONPATH" | grep -q ":\?${PWD}:\?" ); then
    export PYTHONPATH="${PYTHONPATH}:${PWD}"
fi
cd ../oq-platform-standalone
./runserver.sh
