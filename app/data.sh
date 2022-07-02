#!/bin/bash

dir="$1"
if [[ -z $dir ]]; then
    dir="$(dirname "$0")/data"
fi

function parse()
{
    # date prefix
    date="${1:0:10}"

    if [[ ${#date} != 10 || ${date:4:1} != '-' || ${date:7:1} != '-' ]]; then
        >&2 echo "Bad Date Format: $1, $date"
        return 1
    fi

    # strip suffix days
    title="${1:11}"
    title="${title%-[1-9]}"
    title="${title%-[1-9][0-9]}"

    # suffix days
    pos=$((11+${#title}+1))
    days="${1:$pos}"
    #days="${days:-1}"

    echo -n "{\"date\": \"$date\", \"days\": \"$days\", \"title\": \"$title\"}"
}

function data(){
    find "$dir" -maxdepth 1 -type d -iname 'YYYY-*' -or -iname '20*' | sort -r
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

