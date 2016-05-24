#!/bin/sh

rm -rf static static.zip;
gulp;
zip -r static.zip static;
