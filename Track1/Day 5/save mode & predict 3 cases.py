import pickle

model = pickle.load(open("model.pkl", "rb"))

samples = [
    [1, 100, 2, 1, 50],
    [5, 250, 4, 2, 120],
    [8, 500, 6, 3, 250]
]

predictions = model.predict(samples)

for i, p in enumerate(predictions):
    print(f"Case {i+1}: {p}")