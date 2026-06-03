def sort_numbers(numbers):
    even = []
    odd = []

    for num in numbers:
        if num % 2 == 0:
            even.append(num)
        else:
            odd.append(num)

    return even, odd

numbers = []

for i in range(10):
    num = int(input(f"Enter number {i+1}: "))
    numbers.append(num)

even, odd = sort_numbers(numbers)

print("Even Numbers:", even)
print("Odd Numbers:", odd)
