#!/bin/bash
bun build.js
cp -r ui dist/ui
ls
./iina-plugin pack .