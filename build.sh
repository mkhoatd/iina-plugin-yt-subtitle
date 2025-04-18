#!/bin/bash
rm -rf dist
bun build.js

iina-plugin pack .
iina-plugin link .