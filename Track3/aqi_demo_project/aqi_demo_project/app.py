from flask import Flask, render_template, request, redirect, url_for
import sqlite3
import joblib
import json
from datetime import datetime

app = Flask(__name__)
DB = "predictions.db"

# ── Load trained model and encoders ─────────────────────────────────
model          = joblib.load("models/aqi_model.pkl")
state_encoder  = joblib.load("models/state_encoder.pkl")
area_encoder   = joblib.load("models/area_encoder.pkl")
state_area_map = joblib.load("models/state_area_map.pkl")

MONTHS = [
    (1, "January"), (2, "February"), (3, "March"), (4, "April"),
    (5, "May"), (6, "June"), (7, "July"), (8, "August"),
    (9, "September"), (10, "October"), (11, "November"), (12, "December")
]

# ── AQI category bands (CPCB standard) ──────────────────────────────
def get_aqi_category(value):
    if value <= 50:
        return "Good", "good", "Air quality is satisfactory with minimal risk."
    elif value <= 100:
        return "Satisfactory", "satisfactory", "Air quality is acceptable; minor breathing discomfort to sensitive people."
    elif value <= 200:
        return "Moderate", "moderate", "May cause breathing discomfort to people with lung disease, asthma, and heart disease."
    elif value <= 300:
        return "Poor", "poor", "May cause breathing discomfort to most people on prolonged exposure."
    elif value <= 400:
        return "Very Poor", "very-poor", "May cause respiratory illness on prolonged exposure. Avoid outdoor activity."
    else:
        return "Severe", "severe", "Affects healthy people and seriously impacts those with existing diseases. Avoid going outdoors."


# ── Database setup ───────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            state       TEXT NOT NULL,
            area        TEXT NOT NULL,
            month       TEXT NOT NULL,
            stations    INTEGER NOT NULL,
            aqi_value   REAL NOT NULL,
            status      TEXT NOT NULL,
            created_at  TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def get_db():
    conn = sqlite3.connect(DB)
    return conn


# ── Routes ────────────────────────────────────────────────────────────

@app.route("/")
def home():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    conn.close()
    return render_template("home.html", total=total, states=sorted(state_area_map.keys()))


@app.route("/predict", methods=["GET", "POST"])
def predict():
    result = None
    error  = None

    if request.method == "POST":
        try:
            state    = request.form["state"]
            area     = request.form["area"]
            month    = int(request.form["month"])
            stations = int(request.form["stations"])

            state_enc = state_encoder.transform([state])[0]
            area_enc  = area_encoder.transform([area])[0]

            features = [[state_enc, area_enc, month, stations]]
            predicted_aqi = float(model.predict(features)[0])
            predicted_aqi = round(predicted_aqi, 1)

            status, status_class, advisory = get_aqi_category(predicted_aqi)

            month_name = dict(MONTHS)[month]

            # Save to database
            conn = get_db()
            conn.execute(
                "INSERT INTO predictions (state, area, month, stations, aqi_value, status, created_at) VALUES (?,?,?,?,?,?,?)",
                (state, area, month_name, stations, predicted_aqi, status, datetime.now().strftime("%Y-%m-%d %H:%M"))
            )
            conn.commit()
            conn.close()

            result = {
                "state": state,
                "area": area,
                "month": month_name,
                "stations": stations,
                "aqi": predicted_aqi,
                "status": status,
                "status_class": status_class,
                "advisory": advisory
            }
        except Exception as e:
            error = f"Could not generate prediction. Please check your inputs. ({e})"

    return render_template(
        "predict.html",
        result=result,
        error=error,
        states=sorted(state_area_map.keys()),
        state_area_map_json=json.dumps(state_area_map),
        months=MONTHS
    )


@app.route("/history")
def history():
    conn = get_db()
    rows = conn.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT 50").fetchall()
    conn.close()
    return render_template("history.html", predictions=rows)


@app.route("/delete/<int:pid>")
def delete_prediction(pid):
    conn = get_db()
    conn.execute("DELETE FROM predictions WHERE id = ?", (pid,))
    conn.commit()
    conn.close()
    return redirect(url_for("history"))


@app.route("/about")
def about():
    return render_template("about.html")


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
