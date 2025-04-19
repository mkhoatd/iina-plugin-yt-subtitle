#!/bin/bash
rm -rf dist
iina-plugin unlink .
bun build.js
cp -r ui dist/ui

# echo "y" | iina-plugin pack .
iina-plugin link .