def get_grade(marks):
    if marks >= 90:
        return "A"
    elif marks >= 75:
        return "B"
    elif marks >= 60:
        return "C"
    elif marks >= 45:
        return "D"
    else:
        return "F"

students_marks = [95, 82, 67, 50, 30]

for i, marks in enumerate(students_marks, start=1):
    print(f"Student {i}: Marks = {marks}, Grade = {get_grade(marks)}")
