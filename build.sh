#!/bin/bash
ls
mkdir -p iina-plugin-yt-subtitle
bun build.js
cp Info.json iina-plugin-yt-subtitle/Info.json
cp -r ui iina-plugin-yt-subtitle/ui
./iina-plugin pack ./iina-plugin-yt-subtitle