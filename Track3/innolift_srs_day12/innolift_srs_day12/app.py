from flask import Flask, render_template, request, redirect, url_for
import sqlite3

app = Flask(__name__)
DB = "students.db"


def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL,
            roll    TEXT NOT NULL UNIQUE,
            dept    TEXT NOT NULL,
            year    TEXT NOT NULL,
            email   TEXT NOT NULL,
            phone   TEXT NOT NULL,
            gender  TEXT NOT NULL,
            address TEXT NOT NULL
        )
    ''')
    c.execute("SELECT COUNT(*) FROM students")
    if c.fetchone()[0] == 0:
        dummy = [
            ("Yuvaraju",     "22AD001", "AI & Data Science", "2nd Year", "yuvaraju@veltech.edu.in", "9876543210", "Male",   "Chennai, Tamil Nadu"),
            ("Shalini",      "22AD002", "AI & Data Science", "2nd Year", "shalini@veltech.edu.in",  "9876543211", "Female", "Chennai, Tamil Nadu"),
            ("Akshara",      "22AD003", "AI & Data Science", "2nd Year", "akshara@veltech.edu.in",  "9876543212", "Female", "Chennai, Tamil Nadu"),
            ("Rahul Kumar",  "22CS010", "CSE",               "2nd Year", "rahul@veltech.edu.in",    "9876543213", "Male",   "Bengaluru, Karnataka"),
            ("Priya Sharma", "22EC021", "ECE",               "2nd Year", "priya@veltech.edu.in",    "9876543214", "Female", "Hyderabad, Telangana"),
        ]
        c.executemany(
            "INSERT INTO students (name, roll, dept, year, email, phone, gender, address) VALUES (?,?,?,?,?,?,?,?)",
            dummy
        )
    conn.commit()
    conn.close()


def get_db():
    conn = sqlite3.connect(DB)
    return conn


@app.route("/")
def home():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    conn.close()
    return render_template("home.html", total=total)


@app.route("/register", methods=["GET", "POST"])
def register():
    message = None
    error = None
    if request.method == "POST":
        name    = request.form["name"].strip()
        roll    = request.form["roll"].strip()
        dept    = request.form["dept"]
        year    = request.form["year"]
        email   = request.form["email"].strip()
        phone   = request.form["phone"].strip()
        gender  = request.form["gender"]
        address = request.form["address"].strip()
        try:
            conn = get_db()
            conn.execute(
                "INSERT INTO students (name, roll, dept, year, email, phone, gender, address) VALUES (?,?,?,?,?,?,?,?)",
                (name, roll, dept, year, email, phone, gender, address)
            )
            conn.commit()
            conn.close()
            message = f"Student '{name}' registered successfully!"
        except sqlite3.IntegrityError:
            error = f"Roll number '{roll}' already exists!"
    return render_template("register.html", message=message, error=error)


@app.route("/students")
def students_list():
    conn = get_db()
    students = conn.execute("SELECT * FROM students ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("students.html", students=students)


@app.route("/delete/<int:sid>")
def delete_student(sid):
    conn = get_db()
    conn.execute("DELETE FROM students WHERE id = ?", (sid,))
    conn.commit()
    conn.close()
    return redirect(url_for("students_list"))


@app.route("/about")
def about():
    return render_template("about.html")


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
