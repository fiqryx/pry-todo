#!/bin/sh
set -e
./backend migrate
exec ./backend serve