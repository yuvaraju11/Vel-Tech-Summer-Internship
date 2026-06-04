import pandas as pd

df = pd.read_csv("aqi.csv")

print(
    df.groupby("state")["aqi_value"]
    .mean()
    .sort_values(ascending=False)
)

print(
    df.groupby("area")["aqi_value"]
    .mean()
    .sort_values(ascending=False)
)