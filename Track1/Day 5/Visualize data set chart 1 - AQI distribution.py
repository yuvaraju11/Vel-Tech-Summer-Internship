import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("Track1/Day 5/aqi.csv")

status_count = df["air_quality_status"].value_counts()

plt.figure(figsize=(8, 5))
status_count.plot(kind="bar")

plt.title("Air Quality Status Count")
plt.xlabel("Status")
plt.ylabel("Count")

plt.show()