import pandas as pd

df = pd.read_csv("Track1/Day 5/aqi.csv")

print("Dataset Shape:")
print(df.shape)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nStatistics:")
print(df.describe())

if 'air_quality_status' in df.columns:
    print("\nAQI Status Count:")
    print(df['air_quality_status'].value_counts())

if 'prominent_pollutants' in df.columns:
    print("\nTop Pollutants:")
    print(df['prominent_pollutants'].value_counts())

if 'state' in df.columns and 'aqi_value' in df.columns:
    print("\nAverage AQI by State:")
    print(df.groupby('state')['aqi_value'].mean())