# =============================================================================
#  Day 9 — AQI Predictor · All Tasks in One File
#  V. Yuvaraju · InnoTrack 2025 · Track 2
#  Dataset : AQI_cleaned_data.csv
# =============================================================================
#
#  Run this file from the same folder that contains AQI_cleaned_data.csv
#  Command : python day9_aqi_pipeline.py
#
#  What this file does (in order):
#    0. Load data & train a Random Forest Regressor  (saves tuned_model.pkl)
#    1. Task 1  — Feature Importance chart           (saves feature_importance.png)
#    2. Task 2  — Class imbalance check
#    3. Task 3  — Explainability (top-3 feature function)
#    4. Task 4  — Output enrichment (enrich_aqi)
#    5. Task 5  — 5 real-world end-to-end sample predictions
# =============================================================================

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder


# ─────────────────────────────────────────────────────────────────────────────
#  STEP 0 — Load data & train model
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 60)
print("  STEP 0 — Loading data & training Random Forest model")
print("=" * 60)

df = pd.read_csv("AQI_cleaned_data.csv")
print(f"Dataset loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")

# ── Encode categorical columns ───────────────────────────────────────────────
le_state      = LabelEncoder()
le_area       = LabelEncoder()
le_pollutant  = LabelEncoder()

df['state_enc']     = le_state.fit_transform(df['state'])
df['area_enc']      = le_area.fit_transform(df['area'])
df['pollutant_enc'] = le_pollutant.fit_transform(df['prominent_pollutants'])

# ── Define features and target ───────────────────────────────────────────────
FEATURE_COLS = [
    'state_enc',
    'area_enc',
    'number_of_monitoring_stations',
    'pollutant_enc',
    'year',
    'month',
    'day'
]
TARGET = 'aqi_value'

X = df[FEATURE_COLS]
y = df[TARGET]

# ── Train / test split ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train size: {X_train.shape[0]:,}  |  Test size: {X_test.shape[0]:,}")

# ── Train Random Forest ──────────────────────────────────────────────────────
print("\nTraining Random Forest Regressor (this may take ~30 seconds)...")
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=15,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ── Evaluate ─────────────────────────────────────────────────────────────────
y_pred_test = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred_test)
r2  = r2_score(y_test, y_pred_test)
print(f"\nModel Performance on Test Set:")
print(f"  Mean Absolute Error (MAE) : {mae:.2f}")
print(f"  R² Score                  : {r2:.4f}")

# ── Save model ────────────────────────────────────────────────────────────────
joblib.dump(model, 'tuned_model.pkl')
joblib.dump(le_state,     'le_state.pkl')
joblib.dump(le_area,      'le_area.pkl')
joblib.dump(le_pollutant, 'le_pollutant.pkl')
print("\n✓ Model saved as tuned_model.pkl")


# ─────────────────────────────────────────────────────────────────────────────
#  TASK 1 — Feature Importance Analysis
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("  TASK 1 — Feature Importance Analysis")
print("=" * 60)

importances = model.feature_importances_

# Friendly display names (match FEATURE_COLS order)
FEATURE_DISPLAY = [
    'State',
    'Area / City',
    'No. of Monitoring Stations',
    'Prominent Pollutant',
    'Year',
    'Month',
    'Day'
]

importance_df = pd.DataFrame({
    'Feature'   : FEATURE_DISPLAY,
    'Importance': importances
}).sort_values('Importance', ascending=True)

print("\nFeature Importance Scores (highest = most influential):")
for _, row in importance_df.sort_values('Importance', ascending=False).iterrows():
    bar = '█' * int(row['Importance'] * 50)
    print(f"  {row['Feature']:<30} {row['Importance']:.4f}  {bar}")

# ── Plot ──────────────────────────────────────────────────────────────────────
plt.figure(figsize=(9, 5))
colors = ['#2ecc71' if v == importance_df['Importance'].max()
          else '#3498db' for v in importance_df['Importance']]
bars = plt.barh(importance_df['Feature'], importance_df['Importance'],
                color=colors, edgecolor='white', height=0.6)

# Add value labels on bars
for bar, val in zip(bars, importance_df['Importance']):
    plt.text(val + 0.002, bar.get_y() + bar.get_height() / 2,
             f'{val:.4f}', va='center', fontsize=9, color='#2c3e50')

plt.xlabel('Importance Score', fontsize=11)
plt.title('Feature Importance — What the AQI Model Cares About',
          fontsize=13, fontweight='bold', pad=12)
plt.xlim(0, importance_df['Importance'].max() * 1.18)
plt.tight_layout()
plt.savefig('feature_importance.png', dpi=150, bbox_inches='tight')
plt.show()
print("\n✓ Saved: feature_importance.png")


# ─────────────────────────────────────────────────────────────────────────────
#  TASK 2 — Class Imbalance Check
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("  TASK 2 — Class Imbalance Check")
print("=" * 60)

# For a regressor we check the distribution of the AQI status categories
status_counts = df['air_quality_status'].value_counts()
status_pct    = df['air_quality_status'].value_counts(normalize=True) * 100

print("\nAQI Status Distribution in full dataset:")
print(f"  {'Category':<35} {'Count':>8}  {'%':>6}")
print("  " + "-" * 55)
for cat in status_counts.index:
    print(f"  {cat:<35} {status_counts[cat]:>8,}  {status_pct[cat]:>5.1f}%")

# Check ratio of majority to minority
majority = status_counts.max()
minority = status_counts.min()
ratio    = majority / minority

print(f"\n  Majority class : {status_counts.idxmax()}  ({majority:,})")
print(f"  Minority class : {status_counts.idxmin()}  ({minority:,})")
print(f"  Imbalance ratio: {ratio:.1f}:1")

if ratio > 10:
    print("\n  ⚠ Imbalance ratio > 10:1 — consider SMOTE if you convert")
    print("    this to a classification task.")
else:
    print("\n  ✓ Ratio is within acceptable range (< 10:1). No SMOTE needed.")

# Distribution in training split
print("\nAQI value distribution in training set:")
bins   = [0, 50, 100, 150, 200, 500]
labels = ['Good', 'Satisfactory', 'Moderate', 'Poor/Sensitive', 'Hazardous']
y_train_binned = pd.cut(y_train, bins=bins, labels=labels)
print(y_train_binned.value_counts().sort_index().to_string())


# ─────────────────────────────────────────────────────────────────────────────
#  TASK 3 — Explainability (Top-3 Features per Prediction)
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("  TASK 3 — Model Explainability")
print("=" * 60)

def explain_prediction(sample_input_dict: dict, model, feature_names: list,
                        display_names: list) -> list:
    """
    Takes one raw input dict and prints the top 3 features that influenced
    the model's prediction for that sample.

    Parameters
    ----------
    sample_input_dict : dict   — raw input (after encoding) as a flat dict
    model             : trained sklearn model with feature_importances_
    feature_names     : list of column names matching model input
    display_names     : human-readable labels for those columns

    Returns
    -------
    list of (display_name, importance_score) tuples, top 3
    """
    importances   = model.feature_importances_
    feature_pairs = list(zip(display_names, importances))
    feature_pairs.sort(key=lambda x: x[1], reverse=True)
    top_3 = feature_pairs[:3]

    print("\n  Top 3 features influencing this prediction:")
    for rank, (name, score) in enumerate(top_3, 1):
        bar = '▓' * int(score * 40)
        print(f"    {rank}. {name:<30} importance: {score:.4f}  {bar}")

    return top_3


# Demo call with the first test sample
print("\nExample: explaining prediction for X_test row 0")
explain_prediction(
    X_test.iloc[0].to_dict(),
    model,
    FEATURE_COLS,
    FEATURE_DISPLAY
)


# ─────────────────────────────────────────────────────────────────────────────
#  TASK 4 — Output Enrichment
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("  TASK 4 — Domain-Specific Output Enrichment")
print("=" * 60)

def enrich_aqi(aqi_score: float) -> dict:
    """
    Converts a raw AQI number into a human-readable result dict
    with category, colour, health advice, and recommended actions.

    Returns a dict suitable for display in a Flask web app (M3).
    """
    aqi_score = round(float(aqi_score), 1)

    if aqi_score <= 50:
        return {
            'score'           : aqi_score,
            'category'        : 'Good',
            'colour'          : 'green',
            'advice'          : 'Air quality is satisfactory. Enjoy outdoor activities.',
            'recommended_action': 'No restrictions. Safe for all groups.',
            'emoji'           : '🟢'
        }
    elif aqi_score <= 100:
        return {
            'score'           : aqi_score,
            'category'        : 'Moderate',
            'colour'          : 'yellow',
            'advice'          : 'Sensitive groups should limit prolonged outdoor exertion.',
            'recommended_action': 'Asthmatics and elderly should carry medication outdoors.',
            'emoji'           : '🟡'
        }
    elif aqi_score <= 150:
        return {
            'score'           : aqi_score,
            'category'        : 'Unhealthy for Sensitive Groups',
            'colour'          : 'orange',
            'advice'          : 'People with heart or lung disease should reduce outdoor activity.',
            'recommended_action': 'Limit heavy outdoor exertion. Wear N95 mask if going out.',
            'emoji'           : '🟠'
        }
    elif aqi_score <= 200:
        return {
            'score'           : aqi_score,
            'category'        : 'Unhealthy',
            'colour'          : 'red',
            'advice'          : 'Everyone should limit outdoor exertion.',
            'recommended_action': 'Avoid prolonged outdoor activity. Use air purifiers indoors.',
            'emoji'           : '🔴'
        }
    elif aqi_score <= 300:
        return {
            'score'           : aqi_score,
            'category'        : 'Very Unhealthy',
            'colour'          : 'purple',
            'advice'          : 'Health warnings of emergency conditions for everyone.',
            'recommended_action': 'Avoid all outdoor activity. Keep windows closed.',
            'emoji'           : '🟣'
        }
    else:
        return {
            'score'           : aqi_score,
            'category'        : 'Hazardous',
            'colour'          : 'maroon',
            'advice'          : 'Serious risk. Entire population likely to be affected.',
            'recommended_action': 'Stay indoors. Use N95 mask if stepping out is unavoidable.',
            'emoji'           : '🔴🔴'
        }


# Show enrichment demo
demo_scores = [32, 85, 130, 175, 260, 420]
print("\n  enrich_aqi() output for sample scores:")
print(f"  {'AQI':>5}  {'Category':<35} {'Advice (short)'}")
print("  " + "-" * 80)
for score in demo_scores:
    result = enrich_aqi(score)
    print(f"  {result['score']:>5}  {result['emoji']} {result['category']:<33} {result['advice'][:45]}...")

print("\n✓ enrich_aqi() function is ready for Flask integration in M3.")


# ─────────────────────────────────────────────────────────────────────────────
#  TASK 5 — Run 5 Real-World Sample Inputs End-to-End
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("  TASK 5 — 5 Real-World Sample Inputs End-to-End")
print("=" * 60)

def run_full_prediction(raw_input: dict) -> dict:
    """
    Takes a raw user input dict, encodes it, runs it through the
    trained model, and returns a fully enriched human-readable result.

    Parameters
    ----------
    raw_input : dict with keys:
        state, area, number_of_monitoring_stations,
        prominent_pollutants, year, month, day

    Returns
    -------
    dict with prediction, category, colour, advice, recommended_action
    """
    # Load saved model and encoders
    _model       = joblib.load('tuned_model.pkl')
    _le_state    = joblib.load('le_state.pkl')
    _le_area     = joblib.load('le_area.pkl')
    _le_pollutant= joblib.load('le_pollutant.pkl')

    # Encode categorical inputs
    # Handle unseen labels gracefully
    def safe_encode(encoder, value):
        if value in encoder.classes_:
            return encoder.transform([value])[0]
        else:
            return 0   # fallback for unknown location / pollutant

    state_enc     = safe_encode(_le_state,     raw_input['state'])
    area_enc      = safe_encode(_le_area,      raw_input['area'])
    pollutant_enc = safe_encode(_le_pollutant, raw_input['prominent_pollutants'])

    # Build feature row
    input_df = pd.DataFrame([{
        'state_enc'                   : state_enc,
        'area_enc'                    : area_enc,
        'number_of_monitoring_stations': raw_input['number_of_monitoring_stations'],
        'pollutant_enc'               : pollutant_enc,
        'year'                        : raw_input['year'],
        'month'                       : raw_input['month'],
        'day'                         : raw_input['day']
    }])

    # Predict
    predicted_aqi = _model.predict(input_df)[0]

    # Enrich output
    result = enrich_aqi(predicted_aqi)
    result['location'] = f"{raw_input['area']}, {raw_input['state']}"
    result['date']     = f"{raw_input['day']:02d}-{raw_input['month']:02d}-{raw_input['year']}"
    result['pollutant']= raw_input['prominent_pollutants']

    return result


# ── 5 sample inputs (realistic, varied Indian cities/seasons) ─────────────────
samples = [
    # Sample 1 — Delhi winter (PM2.5 dominant, severe season)
    {
        'state': 'Delhi',
        'area': 'Anand Vihar',
        'number_of_monitoring_stations': 3,
        'prominent_pollutants': 'PM2.5',
        'year': 2024, 'month': 12, 'day': 15
    },
    # Sample 2 — Chennai coastal (relatively cleaner)
    {
        'state': 'Tamil Nadu',
        'area': 'Chennai',
        'number_of_monitoring_stations': 2,
        'prominent_pollutants': 'NO2',
        'year': 2024, 'month': 6, 'day': 10
    },
    # Sample 3 — Mumbai monsoon season
    {
        'state': 'Maharashtra',
        'area': 'Mumbai',
        'number_of_monitoring_stations': 4,
        'prominent_pollutants': 'PM10',
        'year': 2024, 'month': 7, 'day': 20
    },
    # Sample 4 — Kolkata post-Diwali (high pollution)
    {
        'state': 'West Bengal',
        'area': 'Kolkata',
        'number_of_monitoring_stations': 3,
        'prominent_pollutants': 'PM2.5',
        'year': 2024, 'month': 11, 'day': 2
    },
    # Sample 5 — Bengaluru (moderate, IT city)
    {
        'state': 'Karnataka',
        'area': 'Bengaluru',
        'number_of_monitoring_stations': 2,
        'prominent_pollutants': 'O3',
        'year': 2024, 'month': 3, 'day': 5
    },
]

print("\nRunning 5 sample predictions...\n")
print(f"  {'#':<3} {'Location':<28} {'Date':<13} {'AQI':>5}  {'Category':<35} {'Status'}")
print("  " + "─" * 100)

all_results = []
for i, sample in enumerate(samples, 1):
    result = run_full_prediction(sample)
    all_results.append(result)
    print(f"  {i:<3} {result['location']:<28} {result['date']:<13} "
          f"{result['score']:>5}  {result['emoji']} {result['category']:<33} "
          f"Pollutant: {sample['prominent_pollutants']}")

print("\n  ── Detailed Output for Each Sample ──")
for i, result in enumerate(all_results, 1):
    print(f"\n  Sample {i} — {result['location']} on {result['date']}")
    print(f"    Predicted AQI    : {result['score']}")
    print(f"    Category         : {result['emoji']}  {result['category']}")
    print(f"    Health Advice    : {result['advice']}")
    print(f"    Recommended Action: {result['recommended_action']}")

# ── Save samples to file for Day 10 ──────────────────────────────────────────
import json
with open('day10_sample_inputs.json', 'w') as f:
    json.dump(samples, f, indent=2)
print("\n✓ 5 sample inputs saved to day10_sample_inputs.json (use these on Day 10)")


# ─────────────────────────────────────────────────────────────────────────────
#  FINAL SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("  DAY 9 COMPLETE — End-of-Day Checklist")
print("=" * 60)
print("  ✓ Model trained and saved         → tuned_model.pkl")
print("  ✓ Feature importance chart saved  → feature_importance.png")
print("  ✓ Class distribution printed      → Task 2 above")
print("  ✓ explain_prediction() working    → Task 3 above")
print("  ✓ enrich_aqi() returning dict     → Task 4 above")
print("  ✓ 5 sample predictions printed    → Task 5 above")
print("  ✓ Sample inputs saved for Day 10  → day10_sample_inputs.json")
print()
print("  Files generated in this folder:")
print("    tuned_model.pkl         ← your trained model")
print("    le_state.pkl            ← state label encoder")
print("    le_area.pkl             ← area label encoder")
print("    le_pollutant.pkl        ← pollutant label encoder")
print("    feature_importance.png  ← Task 1 chart")
print("    day10_sample_inputs.json← Task 5 sample inputs")
print()
print("  Ready for Day 10 — Final Model + M3 Flask handoff.")
print("=" * 60)
