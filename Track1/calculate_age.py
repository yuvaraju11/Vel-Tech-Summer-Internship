from datetime import date

today = date.today()

birth_year = int(input("Enter your birth year: "))

if birth_year >= today.year:
    print("Error: You cannot be negative years old")
else:
    age = today.year - birth_year
    print(f"Your current age is {age}\nAnd after 10 years you will be {age + 10}")