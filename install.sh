#!/bin/bash

# Check if DESTDIR is set
if [ -z "$DESTDIR" ]; then
    # If DESTDIR is not set and the user is root, set it to /usr
    if [ "$(id -u)" -eq 0 ]; then
        DESTDIR="/usr"
    else
        # Otherwise, set it to the user's home directory
        DESTDIR="$HOME"
    fi
fi

# Create the directory if it does not exist
mkdir -p "$DESTDIR/kwin/effects"

# Copy the 'foldingpopups' directory to $DESTDIR/kwin/effects/
cp -r foldingpopups "$DESTDIR/kwin/effects/"

echo "foldingpopups has been copied to $DESTDIR/kwin/effects/"
