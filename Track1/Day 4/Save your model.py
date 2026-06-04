# ==========================================
# TASK 7: SAVE AND LOAD MODEL
# ==========================================

import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# Load Dataset
df = pd.read_csv("aqi.csv")

# Remove missing values
df = df.dropna(
    subset=[
        "number_of_monitoring_stations",
        "aqi_value"
    ]
)

# Features and Target
X = df[["number_of_monitoring_stations"]]
y = df["aqi_value"]

# Split Data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train Model
model = LinearRegression()

model.fit(X_train, y_train)

# Save Model
with open("aqi_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model Saved Successfully")

# Load Model
with open("aqi_model.pkl", "rb") as f:
    loaded_model = pickle.load(f)

print("Model Loaded Successfully")

# Test Prediction
sample = pd.DataFrame(
    {"number_of_monitoring_stations": [20]}
)

prediction = loaded_model.predict(sample)

print("Predicted AQI =", round(prediction[0], 2))