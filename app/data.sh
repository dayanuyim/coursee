#!/bin/bash

dir="$1"
if [[ -z $dir ]]; then
    dir="$(dirname "$0")/data"
fi

function parse()
{
    # format: YYYYMMDD-Title-Days
    y="${1:0:4}"
    m="${1:4:2}"
    d="${1:6:2}"
    if [[ ${#y} != 4 || ( $y != "YYYY" && $y -lt 2000 ) || \
          ${#m} != 2 || ( $m != "MM" && ${m#0} -gt 12 ) || \
          ${#d} != 2 || ( $d != "DD" && ${d#0} -gt 31 ) ]];
    then
        >&2 echo "Bad Date Format: $1, $date"
        return 1
    fi

    date="$y-$m-$d"

    # strip suffix days
    title="${1:9}"
    title="${title%-[1-9]}"
    title="${title%-[1-9][0-9]}"

    # suffix days
    pos=$((9+${#title}+1))
    days="${1:$pos}"
    #days="${days:-1}"

    echo -n "{\"date\": \"$date\", \"days\": \"$days\", \"title\": \"$title\"}"
}

function data(){
    find -L "$dir" -maxdepth 1 -type d \( -iname 'YYYYMMDD-*' -or -name '20[0-9][0-9][01][0-9][0-3][0-9]-*' \) | sort -r
}


echo "["

prev=
curr=

# print the prev line if curr ok
IFS=$'\n'
for path in $(data); do

    curr="$(parse "${path##*/}")"

    if [[ -n $curr ]]; then
        if [[ -n $prev ]]; then
            echo "  $prev,"
        fi
        prev="$curr"
        curr=
    fi
done

# print the last line
if [[ -n $prev ]]; then
    echo "  $prev"
fi

echo "]"

