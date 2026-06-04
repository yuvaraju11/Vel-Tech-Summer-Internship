# ==========================================
# TASK 6: ACTUAL VS PREDICTED AQI
# ==========================================

import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

# Load dataset
df = pd.read_csv("aqi.csv")

# Keep required columns only
df = df.dropna(subset=[
    "number_of_monitoring_stations",
    "aqi_value"
])

# Features and Target
X = df[["number_of_monitoring_stations"]]
y = df["aqi_value"]

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train Model
model = LinearRegression()
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)

# R2 Score
print("R2 Score =", round(r2_score(y_test, y_pred), 4))

# ==========================
# Actual vs Predicted Plot
# ==========================

plt.figure(figsize=(8,6))

plt.scatter(
    y_test,
    y_pred,
    alpha=0.6
)

# Perfect Prediction Line
plt.plot(
    [y_test.min(), y_test.max()],
    [y_test.min(), y_test.max()],
    linestyle="--"
)

plt.title("Actual vs Predicted AQI")
plt.xlabel("Actual AQI")
plt.ylabel("Predicted AQI")

plt.grid(True)

plt.tight_layout()

plt.savefig("actual_vs_predicted_aqi.png")

plt.show()