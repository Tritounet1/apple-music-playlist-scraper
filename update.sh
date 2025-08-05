#!/bin/bash

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

if [ -z "$GITHUB_ACCOUNT" ]; then
    echo "❌ GITHUB_ACCOUNT variable not defined in .env"
    exit 1
fi

if [ -z "$PLAYLIST_URL" ]; then
    echo "❌ PLAYLIST_URL variable not defined in .env"
    exit 1
fi

if [ -z "$NUMBER_OF_TRACKS" ]; then
    echo "❌ NUMBER_OF_TRACKS variable not defined in .env"
    exit 1
fi

node index.js

if [ $? -eq 0 ]; then
    echo "✅ Scraping completed successfully"
    
    if [ "$UPDATE_GITHUB_README" = "true" ]; then
        echo "📝 Updating GitHub README..."
        node script.js
        
        if [ $? -eq 0 ]; then
            echo "✅ GitHub README updated"
        else
            echo "❌ Error updating README"
            exit 1
        fi

        cd /$GITHUB_ACCOUNT
        git add . 
        git commit -m "feat: 🎵 Currently Listening section" 
        git push
    else
        echo "⏭️ GitHub README update disabled"
    fi
else
    echo "❌ Error during scraping"
    exit 1
fi

