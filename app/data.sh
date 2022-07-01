#!/bin/bash

dir="$(dirname "$0")/data"

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

line=
IFS=$'\n'

# print the prev line
for path in $(data); do
    if [[ -n $line ]]; then
        echo "  $line,"
    fi
    line="$(parse "${path##*/}")"
done

# print the last line
if [[ -n $line ]]; then
    echo "  $line"
fi

echo "]"

