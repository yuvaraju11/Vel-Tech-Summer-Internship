"""
train_model.py
Trains a Random Forest model to predict AQI value from
State, Area, Month, and Number of Monitoring Stations.

Run once:  python train_model.py
Produces files inside models/:
  - aqi_model.pkl
  - state_encoder.pkl
  - area_encoder.pkl
  - state_area_map.pkl
  - area_stats.pkl     (historical mean/min/max per area)
  - monthly_avg.pkl    (national monthly average AQI)
  - state_avg.pkl      (top 10 most polluted states)
"""

import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

print("Loading dataset...")
df = pd.read_csv("data/AQI_cleaned_data.csv")
print(f"Rows: {len(df)}")

# ── Encode categorical columns ──────────────────────────────────────
state_encoder = LabelEncoder()
area_encoder  = LabelEncoder()

df["state_enc"] = state_encoder.fit_transform(df["state"])
df["area_enc"]  = area_encoder.fit_transform(df["area"])

# ── Features & target ───────────────────────────────────────────────
FEATURES = ["state_enc", "area_enc", "month", "number_of_monitoring_stations"]
TARGET   = "aqi_value"

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("Training Random Forest Regressor (compact)...")
model = RandomForestRegressor(
    n_estimators=80,
    max_depth=14,
    min_samples_split=6,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ── Evaluate ─────────────────────────────────────────────────────────
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
r2  = r2_score(y_test, preds)
print(f"MAE : {mae:.2f}")
print(f"R2  : {r2:.3f}")

# ── Save model + encoders (compressed) ────────────────────────────────
joblib.dump(model, "models/aqi_model.pkl", compress=3)
joblib.dump(state_encoder, "models/state_encoder.pkl")
joblib.dump(area_encoder, "models/area_encoder.pkl")

# ── Save state -> area mapping for the dropdown ─────────────────────
state_area_map = (
    df.groupby("state")["area"]
    .unique()
    .apply(lambda x: sorted(x.tolist()))
    .to_dict()
)
joblib.dump(state_area_map, "models/state_area_map.pkl")

# ── Save per-area historical stats (sanity bounds + dashboard) ───────
area_stats = (
    df.groupby(["state", "area"])
    .agg(mean=("aqi_value", "mean"),
         min=("aqi_value", "min"),
         max=("aqi_value", "max"),
         count=("aqi_value", "count"),
         avg_stations=("number_of_monitoring_stations", "mean"))
    .reset_index()
)
area_stats_dict = {}
for _, row in area_stats.iterrows():
    area_stats_dict[(row["state"], row["area"])] = {
        "mean": round(float(row["mean"]), 1),
        "min": int(row["min"]),
        "max": int(row["max"]),
        "count": int(row["count"]),
        "avg_stations": max(1, round(row["avg_stations"])),
    }
joblib.dump(area_stats_dict, "models/area_stats.pkl")

# ── Save one representative (most-monitored) area per state ─────────
# Used by the "Live AQI — All States" page to give each state its own
# real prediction (not a repeated/dummy value).
state_repr = {}
for state, group in area_stats.groupby("state"):
    top = group.sort_values("count", ascending=False).iloc[0]
    state_repr[state] = {
        "area": top["area"],
        "stations": max(1, round(top["avg_stations"])),
    }
joblib.dump(state_repr, "models/state_repr.pkl")

# ── Save monthly national averages (dashboard trend chart) ───────────
monthly_avg = df.groupby("month")["aqi_value"].mean().round(1).to_dict()
joblib.dump(monthly_avg, "models/monthly_avg.pkl")

# ── Save top 10 most polluted states (avg AQI) ────────────────────────
state_avg = (
    df.groupby("state")["aqi_value"]
    .mean()
    .round(1)
    .sort_values(ascending=False)
    .head(10)
    .to_dict()
)
joblib.dump(state_avg, "models/state_avg.pkl")

size_mb = os.path.getsize("models/aqi_model.pkl") / (1024 * 1024)
print(f"\nModel size: {size_mb:.1f} MB")
print("Saved: aqi_model.pkl, state_encoder.pkl, area_encoder.pkl,")
print("       state_area_map.pkl, area_stats.pkl, monthly_avg.pkl, state_avg.pkl, state_repr.pkl")
print("Done.")
