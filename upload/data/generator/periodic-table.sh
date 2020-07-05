#!/usr/bin/env zsh

set -e

cd $(dirname $0)

category_dir=../category
category_file=$category_dir/periodic-table.json
temp_directory="b74eb57e-9c7c-4850-8e5a-9f522c8609b9"
html_file="$temp_directory/list-of-chemical-elements.html"
french_html_file="$temp_directory/french.html"
json_file="$temp_directory/list-of-chemical-elements.json"
french_json_file="$temp_directory/french.json"
summary_dir="$temp_directory/summary"
item_dir="$temp_directory/item"

mkdir -p $temp_directory
mkdir -p $summary_dir
mkdir -p $item_dir
if [ ! -f $html_file ]
then
  curl -s https://en.wikipedia.org/wiki/List_of_chemical_elements > $html_file
fi
if [ ! -f $french_html_file ]
then
  curl -s https://fr.wikipedia.org/wiki/Liste_des_%C3%A9l%C3%A9ments_chimiques > $french_html_file
fi
cat $html_file | pup ".wikitable tr:nth-child(n+5) json{}" > $json_file
cat $french_html_file | pup '.wikitable tr:nth-child(n+2) json{}' > $french_json_file
declare -A french_name_map
cat $french_json_file | jq -rc '.[]' | while read -r json
do
  number=$(echo $json | jq -re '.children[0].text')
  name=$(echo $json | jq -re '.children[1].children[0].text')
  french_name_map[$number]=$name
done
rm -rf "$item_dir/*"
cat $json_file | jq -rc 'map(select(.children[0] | has("text"))) | .[]' | while read -r json
do
  number=$(echo $json | jq -re '.children[0].text')
  symbol=$(echo $json | jq -re '.children[1].text')
  name=$(echo $json | jq -re '.children[2].children[0].text')
  echo $number $symbol $name
  url="https://en.wikipedia.org$(echo $json | jq -re '.children[2].children[0].href')"
  base=$(basename $url)
  summary_url="https://en.wikipedia.org/api/rest_v1/page/summary/$base"
  summary_file="$summary_dir/$base.json"
  if [ ! -f $summary_file ]
  then
    curl -s $summary_url | jq > $summary_file
  fi
  extract=$(cat $summary_file | jq -re '.extract')
  thumbnail=$(cat $summary_file | jq -r '.thumbnail.source')
  spellings=($(echo $symbol | awk '{print tolower($0)}'))
  french_spelling=$french_name_map[$number]
  if [ ! $french_spelling = $name ]; then
    spellings+=($(echo $french_spelling | awk '{print tolower($0)}'))
  fi
  spellings='["'$(echo $spellings | sed 's/ /", "/g')'"]'
  jq -n \
    --arg name $name \
    --arg url $url \
    --arg imageUrl $thumbnail \
    --arg description $extract \
    --argjson spellings $spellings '
      { "name": $name
      , "url": $url
      , "imageUrl": $imageUrl
      , "description": $description
      , "spellings": $spellings
      }
    ' > "$item_dir/$base.json"
done

jq -s '
    { "id": "periodic-table"
    , "name": "Periodic table"
    , "description": "The 118 chemical elements which have been identified as of 2020."
    , "languages": ["english", "french"]
    , "tags": ["chemistry", "stem"]
    , "items": .
    }
  ' $item_dir/* > $category_file