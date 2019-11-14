#!/bin/bash

missing="aggregate_by
asset_correlation
asset_life_expectancy
avg_losses
concurrent_tasks
coordinate_bin_width
distance_bin_width
export_dir
fragility_file
gsim
interest_rate
lrem_steps_per_interval
mag_bin_width
max
mean
minimum_intensity
minimum_magnitude
nonstructural_vulnerability_file
num_epsilon_bins
occupants_vulnerability_file
poes_disagg
pointsource_distance
ses_seed
sites
steps_per_interval
structural_vulnerability_file
structural_vulnerability_retrofitted_file
time_event"

IFS='
'
if [ "$1" = "listparams" ]; then
    shift
    ( for ini in $(find $1 -name '*.ini'); do
          grep -v '^\[.*\]$' "$ini" | grep -v '^ *$' | grep -v '^[# ].*' | sed 's/ =.*//g'
      done ) | sort | uniq
elif [ "$1" = "missing" ]; then
    shift
    for mis in $(echo "$missing"); do
        grep -rq "^$mis" "$1" && echo "par: $mis"
    done
elif [ "$1" = "diff" ]; then
    shift
    diff -u <(grep -v '^\[.*\]$' "$1" | grep -v '^ *$' | grep -v '^[# ].*' | sort) <(grep -v '^\[.*\]$' "$2" | grep -v '^ *$' | grep -v '^[# ].*' | sort)
fi

