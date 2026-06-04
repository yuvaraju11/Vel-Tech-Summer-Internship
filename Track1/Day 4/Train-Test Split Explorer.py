import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

df = pd.read_csv("aqi.csv")

df = df.dropna(
    subset=[
        "number_of_monitoring_stations",
        "aqi_value"
    ]
)

X = df[["number_of_monitoring_stations"]]
y = df["aqi_value"]

for size in [0.1,0.2,0.3]:

    X_train,X_test,y_train,y_test = train_test_split(
        X,y,
        test_size=size,
        random_state=42
    )

    model = LinearRegression()

    model.fit(X_train,y_train)

    pred = model.predict(X_test)

    rmse = mean_squared_error(
        y_test,pred
    ) ** 0.5

    print("\nTest Size:",size)
    print("RMSE:",rmse)