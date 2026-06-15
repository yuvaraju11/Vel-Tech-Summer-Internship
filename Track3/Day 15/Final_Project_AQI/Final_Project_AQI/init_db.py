import pandas as pd
import numpy as np
import sqlite3
import json
import os

def init_database():
    csv_path = r"c:\Users\Yuvaraju\OneDrive\Documents\Final_Project_AQI\AQI_cleaned_data.csv"
    db_path = r"c:\Users\Yuvaraju\OneDrive\Documents\Final_Project_AQI\aqi_database.db"
    mapping_path = r"c:\Users\Yuvaraju\OneDrive\Documents\Final_Project_AQI\mappings.json"

    print(f"Reading dataset: {csv_path}...")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Cleaned AQI CSV data not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows.")

    # 1. GENERATE MAPPINGS
    print("Generating alphabetical label encoding mappings...")
    states = sorted(df['state'].unique())
    areas = sorted(df['area'].unique())
    pollutants = sorted(df['prominent_pollutants'].unique())

    # Create mapping dictionaries
    state_to_code = {state: int(idx) for idx, state in enumerate(states)}
    area_to_code = {area: int(idx) for idx, area in enumerate(areas)}
    pollutant_to_code = {pollutant: int(idx) for idx, pollutant in enumerate(pollutants)}

    # Map state to its unique areas
    state_areas = {}
    for state in states:
        state_df = df[df['state'] == state]
        state_areas[state] = sorted(state_df['area'].unique().tolist())

    # Map area to its average monitoring stations count (default value for form)
    area_avg_stations = {}
    for area in areas:
        area_df = df[df['area'] == area]
        area_avg_stations[area] = float(np.round(area_df['number_of_monitoring_stations'].mean(), 1))

    mappings = {
        'states': states,
        'areas': areas,
        'pollutants': pollutants,
        'state_to_code': state_to_code,
        'area_to_code': area_to_code,
        'pollutant_to_code': pollutant_to_code,
        'state_areas': state_areas,
        'area_avg_stations': area_avg_stations
    }

    # Save mappings to JSON
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(mappings, f, indent=4)
    print(f"Saved mappings to {mapping_path}")

    # 2. POPULATE SQLITE DATABASE
    print(f"Initializing SQLite Database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create Tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS city_stats (
        area TEXT PRIMARY KEY,
        state TEXT,
        avg_aqi REAL,
        record_count INTEGER,
        main_pollutant TEXT,
        avg_stations REAL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS state_stats (
        state TEXT PRIMARY KEY,
        avg_aqi REAL,
        record_count INTEGER
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS temporal_trends (
        year INTEGER,
        month INTEGER,
        avg_aqi REAL,
        record_count INTEGER
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT,
        area TEXT,
        pollutant TEXT,
        stations INTEGER,
        prediction_date TEXT,
        predicted_aqi REAL,
        air_quality_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Commit tables creation
    conn.commit()

    # Pre-compute City Statistics
    print("Computing city-wise statistics...")
    # Get main pollutant (most frequent) per city
    city_pollutants = df.groupby('area')['prominent_pollutants'].agg(lambda x: x.mode().iloc[0] if not x.empty else 'Unknown')
    city_grouped = df.groupby(['area', 'state']).agg({
        'aqi_value': 'mean',
        'date': 'count',
        'number_of_monitoring_stations': 'mean'
    }).reset_index()

    city_stats_data = []
    for idx, row in city_grouped.iterrows():
        area = row['area']
        state = row['state']
        avg_aqi = float(np.round(row['aqi_value'], 2))
        count = int(row['date'])
        avg_stations = float(np.round(row['number_of_monitoring_stations'], 2))
        main_pollutant = city_pollutants.get(area, 'Unknown')
        city_stats_data.append((area, state, avg_aqi, count, main_pollutant, avg_stations))

    # Pre-compute State Statistics
    print("Computing state-wise statistics...")
    state_grouped = df.groupby('state').agg({
        'aqi_value': 'mean',
        'date': 'count'
    }).reset_index()

    state_stats_data = []
    for idx, row in state_grouped.iterrows():
        state = row['state']
        avg_aqi = float(np.round(row['aqi_value'], 2))
        count = int(row['date'])
        state_stats_data.append((state, avg_aqi, count))

    # Pre-compute Temporal Trends
    print("Computing temporal trend statistics...")
    temporal_grouped = df.groupby(['year', 'month']).agg({
        'aqi_value': 'mean',
        'date': 'count'
    }).reset_index()

    temporal_data = []
    for idx, row in temporal_grouped.iterrows():
        year = int(row['year'])
        month = int(row['month'])
        avg_aqi = float(np.round(row['aqi_value'], 2))
        count = int(row['date'])
        temporal_data.append((year, month, avg_aqi, count))

    # Insert into Database
    cursor.executemany("INSERT OR REPLACE INTO city_stats VALUES (?, ?, ?, ?, ?, ?)", city_stats_data)
    cursor.executemany("INSERT OR REPLACE INTO state_stats VALUES (?, ?, ?)", state_stats_data)
    cursor.executemany("INSERT OR REPLACE INTO temporal_trends VALUES (?, ?, ?, ?)", temporal_data)

    conn.commit()
    conn.close()
    print("Database populated successfully!")

if __name__ == "__main__":
    init_database()
