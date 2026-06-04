import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

df = pd.read_csv("aqi.csv")

df = df.dropna(
    subset=[
        "number_of_monitoring_stations",
        "aqi_value"
    ]
)

X = df[["number_of_monitoring_stations"]]
y = df["aqi_value"]

X_train,X_test,y_train,y_test = train_test_split(
    X,y,
    test_size=0.2,
    random_state=42
)

model = LinearRegression()

model.fit(X_train,y_train)

pred = model.predict(X_test)

print("R2 =", r2_score(y_test,pred))

import pandas as pd

new_station = pd.DataFrame(
    {"number_of_monitoring_stations": [20]}
)

prediction = model.predict(new_station)

print("Predicted AQI =", prediction[0])