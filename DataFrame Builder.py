import pandas as pd

data = {
    "name": ["Arun", "Priya", "Rahul", "Meena", "Karthik"],
    "age": [20, 21, 19, 22, 20],
    "city": ["Chennai", "Madurai", "Salem", "Trichy", "Coimbatore"],
    "marks": [85, 42, 76, 91, 48]
}

df = pd.DataFrame(data)

df["result"] = df["marks"].apply(
    lambda x: "Pass" if x >= 50 else "Fail"
)

print("Head:")
print(df.head())

print("\nShape:")
print(df.shape)

print("\nData Types:")
print(df.dtypes)