#!/bin/zsh
set -e
cd "$(dirname "$0")"

file="./data/category/pokemon.json"
json="$(cat "$file")"
last_item_index="$(echo "$json" | jq -re '.items | length | . - 1')"
for index in {0..$last_item_index}
do
  item="$(echo "$json" | jq -re --argjson index "$index" '.items[$index]')"
  name="$(echo "$item" | jq -re '.name')"
  echo "$name"
  if ("$(echo "$item" | jq -re 'has("url")')" = "true") && ("$(echo "$item" | jq -re 'has("imageUrl")')" = "true")
  then
    echo "Skipping"
    echo
    continue
  fi
  url="$(curl -Ls -o /dev/null -w %{url_effective} "https://bulbapedia.bulbagarden.net/wiki/$name")"
  echo "$url"
  imageUrl="https:$(curl -s "$url" | pup 'a.image > img attr{src}' | head -n1)"
  echo "$imageUrl"
  item="$(echo "$item" | jq -re --arg url "$url" '.url = $url')"
  item="$(echo "$item" | jq -re --arg imageUrl "$imageUrl" '.imageUrl = $imageUrl')"
  json="$(echo "$json" | jq -re --argjson index "$index" --argjson item "$item" '.items[$index] = $item')"
  echo "$json" | jq > "$file"
  echo
  sleep 5
done
