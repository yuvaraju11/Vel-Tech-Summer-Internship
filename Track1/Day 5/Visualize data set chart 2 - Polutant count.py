import pandas as pd
import matplotlib.pyplot as plt
import os

# Create charts folder if it doesn't exist
os.makedirs("charts", exist_ok=True)

# Load dataset
df = pd.read_csv("Track1/Day 5/aqi.csv")

# Count pollutants
pollutant_counts = df["prominent_pollutants"].value_counts()

# Create chart
plt.figure(figsize=(10, 6))
pollutant_counts.plot(kind="bar")

plt.title("Pollutant Count")
plt.xlabel("Prominent Pollutants")
plt.ylabel("Count")
plt.xticks(rotation=45)

plt.tight_layout()

# Save chart as image
plt.savefig("charts/pollutant_count.png")

# Display chart
plt.show()

print("Chart saved successfully: charts/pollutant_count.png")