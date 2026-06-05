import pandas as pd

df = pd.read_csv("Track1/Day 5/aqi.csv")

print("Dataset Loaded Successfully!")

print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nMissing Values:")
print(df.isnull().sum())