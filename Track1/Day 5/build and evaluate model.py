import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle

# Load dataset
df = pd.read_csv("Track1/Day 5/aqi.csv")

print("Columns:")
print(df.columns.tolist())

# Fill missing values if column exists
if "note" in df.columns:
    df["note"] = df["note"].fillna("Unknown")

# Encode categorical columns
encoder = LabelEncoder()

for col in ["state", "area", "prominent_pollutants"]:
    if col in df.columns:
        df[col] = encoder.fit_transform(df[col].astype(str))

# Features and Target
required_columns = [
    "state",
    "area",
    "number_of_monitoring_stations",
    "prominent_pollutants",
    "aqi_value",
    "air_quality_status"
]

missing = [col for col in required_columns if col not in df.columns]

if missing:
    print("Missing Columns:", missing)
else:
    X = df[
        [
            "state",
            "area",
            "number_of_monitoring_stations",
            "prominent_pollutants",
            "aqi_value"
        ]
    ]

    y = df["air_quality_status"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42
    )

    model = RandomForestClassifier(random_state=42)

    model.fit(X_train, y_train)

    pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, pred)

    print("\nAccuracy:", accuracy)

    with open("model.pkl", "wb") as f:
        pickle.dump(model, f)

    print("Model saved as model.pkl")