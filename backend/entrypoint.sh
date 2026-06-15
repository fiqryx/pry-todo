#!/bin/sh
set -e
./main migrate
exec ./main serve