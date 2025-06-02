#!/usr/bin/env python3

import os
import sqlite3
import json
from datetime import datetime

# Check if we have a local SQLite database
if os.path.exists('twovue.db'):
    print("📊 Found local SQLite database")
    conn = sqlite3.connect('twovue.db')
    cursor = conn.cursor()
    
    # Find games with quantum-pattern-ultra in the name
    cursor.execute("SELECT * FROM games WHERE id LIKE '%quantum-pattern-ultra%'")
    games = cursor.fetchall()
    
    print(f"🎮 Found {len(games)} games matching 'quantum-pattern-ultra'")
    
    for game in games:
        game_id = game[0]
        player1 = game[1]
        player2 = game[2]
        status = game[3]
        
        print(f"\n🆔 Game ID: {game_id}")
        print(f"👤 Player 1: {player1}")
        print(f"👤 Player 2: {player2}")
        print(f"📊 Status: {status}")
        
        # Get all turns for this game
        cursor.execute("SELECT * FROM turns WHERE game_id = ? ORDER BY created_at", (game_id,))
        turns = cursor.fetchall()
        
        print(f"🔄 Total turns in database: {len(turns)}")
        
        # Check for duplicates
        photo_urls = {}
        duplicates = []
        
        for i, turn in enumerate(turns):
            turn_id = turn[0]
            player_name = turn[2]
            photo_url = turn[3]
            turn_number = turn[6]
            created_at = turn[7]
            
            print(f"  Turn {i+1}: Player={player_name}, Turn#={turn_number}, Time={created_at}")
            print(f"    Photo: {photo_url}")
            
            # Track photo URLs to find duplicates
            if photo_url in photo_urls:
                duplicates.append({
                    'original': photo_urls[photo_url],
                    'duplicate': {
                        'turn_id': turn_id,
                        'player': player_name,
                        'turn_number': turn_number,
                        'created_at': created_at
                    }
                })
                print(f"    ⚠️ DUPLICATE PHOTO DETECTED!")
            else:
                photo_urls[photo_url] = {
                    'turn_id': turn_id,
                    'player': player_name,
                    'turn_number': turn_number,
                    'created_at': created_at
                }
        
        if duplicates:
            print(f"\n🚨 Found {len(duplicates)} duplicate submissions:")
            for dup in duplicates:
                print(f"  Original: {dup['original']['created_at']}")
                print(f"  Duplicate: {dup['duplicate']['created_at']}")
                print(f"  Same photo, same player: {dup['original']['player'] == dup['duplicate']['player']}")
        else:
            print("✅ No duplicate photo submissions found")
    
    conn.close()
    
else:
    print("❌ No local SQLite database found (twovue.db)")
    print("💡 This script is designed for local development database checking") 