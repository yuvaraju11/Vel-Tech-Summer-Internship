import pandas as pd
import matplotlib.pyplot as plt
import os

# Create charts folder
os.makedirs("charts", exist_ok=True)

# Load dataset
df = pd.read_csv("Track1/Day 5/aqi.csv")

# Top 10 states by average AQI
top = (
    df.groupby("state")["aqi_value"]
    .mean()
    .sort_values(ascending=False)
    .head(10)
)

# Plot chart
plt.figure(figsize=(10, 6))
top.plot(kind="bar")

plt.title("Top 10 States by Average AQI")
plt.xlabel("State")
plt.ylabel("Average AQI")
plt.xticks(rotation=45)

plt.tight_layout()

# Save image
plt.savefig("charts/state_wise_aqi.png")

# Show chart
plt.show()

print("Chart saved as charts/state_wise_aqi.png")