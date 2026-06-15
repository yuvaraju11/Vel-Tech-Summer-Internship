from flask import Flask, render_template, request, jsonify
import sqlite3
import joblib
import json
import os
from datetime import datetime
import numpy as np

app = Flask(__name__)
app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'aqi_database.db')
app.config['MAPPINGS_FILE'] = os.path.join(os.path.dirname(__file__), 'mappings.json')
app.config['MODEL_FILE'] = os.path.join(os.path.dirname(__file__), 'tuned_model.pkl')

# Global variables loaded on startup
model = None
mappings = {}

def get_db_connection():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def load_resources():
    global model, mappings
    # Load Model
    if os.path.exists(app.config['MODEL_FILE']):
        try:
            model = joblib.load(app.config['MODEL_FILE'])
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Model file not found at {app.config['MODEL_FILE']}")
        
    # Load Mappings
    if os.path.exists(app.config['MAPPINGS_FILE']):
        try:
            with open(app.config['MAPPINGS_FILE'], 'r', encoding='utf-8') as f:
                mappings = json.load(f)
            print("Mappings loaded successfully.")
        except Exception as e:
            print(f"Error loading mappings: {e}")
    else:
        print(f"Mappings file not found at {app.config['MAPPINGS_FILE']}")

# Load everything once
load_resources()

def classify_aqi(aqi):
    # Clip AQI to standard reasonable bounds
    aqi_val = max(0, float(aqi))
    
    if aqi_val <= 50:
        status = "Good"
        color_class = "aqi-good"
        hex_color = "#2ecc71"  # Green
        advisory = "Air quality is considered satisfactory, and air pollution poses little or no risk. Enjoy your outdoor activities and open windows for ventilation."
    elif aqi_val <= 100:
        status = "Satisfactory"
        color_class = "aqi-satisfactory"
        hex_color = "#27ae60"  # Light Green
        advisory = "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of individuals who are unusually sensitive to air pollution. Children and active adults with respiratory diseases should monitor symptoms."
    elif aqi_val <= 200:
        status = "Moderate"
        color_class = "aqi-moderate"
        hex_color = "#f1c40f"  # Yellow
        advisory = "Members of sensitive groups (people with asthma, lung or heart diseases, children, elderly) may experience health effects. Wear a mask if outdoors for long periods and reduce heavy physical exertion."
    elif aqi_val <= 300:
        status = "Poor"
        color_class = "aqi-poor"
        hex_color = "#e67e22"  # Orange
        advisory = "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects. Reduce outdoor activity, wear an N95 mask, and use air purifiers indoors if possible."
    elif aqi_val <= 400:
        status = "Very Poor"
        color_class = "aqi-very-poor"
        hex_color = "#e74c3c"  # Red
        advisory = "Health alert: everyone may experience more serious health effects. Avoid outdoor physical activity. Children, elderly, and those with cardiopulmonary illnesses should remain indoors with windows shut."
    else:
        status = "Severe"
        color_class = "aqi-severe"
        hex_color = "#800000"  # Dark Red / Maroon
        advisory = "Emergency health warning: serious respiratory effects likely even in healthy individuals. Everyone must stay indoors, run air purifiers, keep windows fully closed, and consult a doctor if experiencing respiratory distress."

    return {
        'value': int(np.round(aqi_val)),
        'status': status,
        'color_class': color_class,
        'hex_color': hex_color,
        'advisory': advisory
    }

# --- ROUTES ---

@app.route('/')
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Total statistics & averages
    cursor.execute("SELECT AVG(avg_aqi) FROM state_stats")
    national_avg = cursor.fetchone()[0]
    national_avg = round(national_avg, 1) if national_avg else 0
    
    cursor.execute("SELECT COUNT(*), SUM(record_count) FROM city_stats")
    row = cursor.fetchone()
    total_cities = row[0]
    total_records = row[1] if row[1] else 0

    # 2. Cleanest and Most Polluted Cities
    cursor.execute("SELECT area, state, avg_aqi FROM city_stats ORDER BY avg_aqi ASC LIMIT 5")
    cleanest_cities = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT area, state, avg_aqi FROM city_stats ORDER BY avg_aqi DESC LIMIT 5")
    polluted_cities = [dict(r) for r in cursor.fetchall()]

    # 3. State stats for chart
    cursor.execute("SELECT state, avg_aqi FROM state_stats ORDER BY avg_aqi DESC")
    state_aqi_list = [dict(r) for r in cursor.fetchall()]

    # 4. Temporal trend data for chart
    cursor.execute("SELECT year, month, avg_aqi FROM temporal_trends ORDER BY year ASC, month ASC")
    temporal_trends = [dict(r) for r in cursor.fetchall()]

    # 5. Most common pollutants overall (approximate based on city counts)
    cursor.execute("SELECT main_pollutant, COUNT(*) as count FROM city_stats GROUP BY main_pollutant ORDER BY count DESC")
    pollutants_dist = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Create month names for temporal trends
    months_map = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 
                  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
    for trend in temporal_trends:
        trend['month_name'] = f"{months_map.get(trend['month'], str(trend['month']))} {trend['year']}"

    return render_template(
        'dashboard.html',
        national_avg=national_avg,
        total_cities=total_cities,
        total_records=total_records,
        cleanest_cities=cleanest_cities,
        polluted_cities=polluted_cities,
        state_aqi_list=state_aqi_list,
        temporal_trends=temporal_trends,
        pollutants_dist=pollutants_dist,
        active_page='dashboard'
    )

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    if not mappings:
        return "System error: Mappings not loaded. Run database setup first.", 500
        
    states = mappings.get('states', [])
    pollutants = mappings.get('pollutants', [])
    state_areas = mappings.get('state_areas', {})
    area_avg_stations = mappings.get('area_avg_stations', {})
    
    # Default selection on GET
    default_state = states[0] if states else ""
    default_cities = state_areas.get(default_state, [])
    default_city = default_cities[0] if default_cities else ""
    default_stations = int(np.round(area_avg_stations.get(default_city, 1)))

    if request.method == 'POST':
        # Handles prediction request
        try:
            state = request.form.get('state')
            area = request.form.get('area')
            pollutant = request.form.get('pollutant')
            stations = request.form.get('stations')
            date_str = request.form.get('date')

            # Validation
            if not all([state, area, pollutant, stations, date_str]):
                return jsonify({'error': 'All form fields are required.'}), 400

            stations_val = int(stations)
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day

            # Encode inputs
            state_enc = mappings['state_to_code'].get(state, 0)
            area_enc = mappings['area_to_code'].get(area, 0)
            pollutant_enc = mappings['pollutant_to_code'].get(pollutant, 0)

            import pandas as pd
            input_df = pd.DataFrame([[state_enc, area_enc, stations_val, pollutant_enc, year, month, day]],
                                    columns=['state_enc', 'area_enc', 'number_of_monitoring_stations', 'pollutant_enc', 'year', 'month', 'day'])
            
            # Predict
            predicted_raw = model.predict(input_df)[0]
            classification = classify_aqi(predicted_raw)

            # Store in SQLite
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO predictions (state, area, pollutant, stations, prediction_date, predicted_aqi, air_quality_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (state, area, pollutant, stations_val, date_str, classification['value'], classification['status']))
            conn.commit()
            conn.close()

            # Return response
            return jsonify({
                'success': True,
                'predicted_aqi': classification['value'],
                'status': classification['status'],
                'color_class': classification['color_class'],
                'hex_color': classification['hex_color'],
                'advisory': classification['advisory'],
                'input': {
                    'state': state,
                    'area': area,
                    'pollutant': pollutant,
                    'stations': stations_val,
                    'date': date_str
                }
            })

        except Exception as e:
            return jsonify({'error': f"Prediction failed: {str(e)}"}), 500

    return render_template(
        'predict.html',
        states=states,
        pollutants=pollutants,
        default_state=default_state,
        default_cities=default_cities,
        default_city=default_city,
        default_stations=default_stations,
        current_date=datetime.now().strftime("%Y-%m-%d"),
        active_page='predict'
    )

@app.route('/history')
def history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, state, area, pollutant, stations, prediction_date, predicted_aqi, air_quality_status, created_at
        FROM predictions
        ORDER BY created_at DESC
    ''')
    rows = cursor.fetchall()
    predictions_log = [dict(r) for r in rows]
    conn.close()

    # Re-apply color classes for the UI table
    for log in predictions_log:
        aqi_info = classify_aqi(log['predicted_aqi'])
        log['color_class'] = aqi_info['color_class']

    return render_template('history.html', predictions_log=predictions_log, active_page='history')

@app.route('/live')
def live_aqi():
    return render_template('live.html', active_page='live')

@app.route('/api/cities/<state>')
def api_cities(state):
    state_areas = mappings.get('state_areas', {})
    cities = state_areas.get(state, [])
    return jsonify({'cities': cities})

@app.route('/api/avg_stations/<area>')
def api_avg_stations(area):
    area_avg_stations = mappings.get('area_avg_stations', {})
    avg_stations = int(np.round(area_avg_stations.get(area, 1)))
    return jsonify({'avg_stations': avg_stations})

@app.route('/api/clear_history', methods=['POST'])
def api_clear_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions")
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'History cleared successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete_row/<int:row_id>', methods=['POST'])
def api_delete_row(row_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions WHERE id = ?", (row_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'Record {row_id} deleted.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
