import pandas as pd

df = pd.read_csv("Track1/Day 5/aqi.csv")

print("First 5 Rows:")
print(df.head())

print("\nShape:")
print(df.shape)

print("\nColumn Types:")
print(df.dtypes)