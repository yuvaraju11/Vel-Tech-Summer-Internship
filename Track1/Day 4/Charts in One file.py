import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("./aqi.csv")

state_avg = (
    df.groupby("state")["aqi_value"]
    .mean()
    .sort_values(ascending=False)
    .head(15)
)

plt.figure(figsize=(12,6))
state_avg.plot(kind="bar")

plt.title("Average AQI by State")
plt.xlabel("State")
plt.ylabel("AQI Value")

plt.tight_layout()
plt.savefig("aqi_by_state.png")
plt.show()