import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("aqi.csv")

top10 = df.groupby("state")["aqi_value"].mean().sort_values(
    ascending=False
).head(10)

colors = [
    "red","orange","yellow","green","blue",
    "purple","pink","brown","gray","cyan"
]

mean_aqi = top10.mean()

plt.figure(figsize=(12,6))

plt.bar(top10.index, top10.values,
        color=colors)

plt.axhline(
    mean_aqi,
    color="black",
    linestyle="--",
    label="Mean AQI"
)

plt.title("Top 10 States by AQI")
plt.xlabel("State")
plt.ylabel("AQI")

plt.legend()
plt.xticks(rotation=45)

plt.tight_layout()
plt.savefig('styledchart.png')
plt.show()