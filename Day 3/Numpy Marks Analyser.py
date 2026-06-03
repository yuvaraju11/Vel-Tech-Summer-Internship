import numpy as np

# Create NumPy array of 10 student marks
marks = np.array([78, 45, 67, 89, 34, 56, 92, 48, 73, 61])

# Calculations
mean_marks = np.mean(marks)
highest = np.max(marks)
lowest = np.min(marks)
std_dev = np.std(marks)
passed = np.sum(marks >= 50)

# Summary Report
print("===== MARKS SUMMARY REPORT =====")
print("Marks:", marks)
print("Mean Marks:", mean_marks)
print("Highest Marks:", highest)
print("Lowest Marks:", lowest)
print("Standard Deviation:", std_dev)
print("Students Passed (>=50):", passed)
