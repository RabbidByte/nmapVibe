# Python Virtual Environment Setup for Flask App (Linux)

This guide explains how to create, activate, run, exit, and remove a Python virtual environment for a Flask application on Linux.

---

## 1. Install required system packages

Ensure Python virtual environment support and pip are installed:

```bash
sudo apt update
sudo apt install python3-venv python3-pip -y
```

---

## 2. Create a virtual environment

From inside your project directory:

```bash
python3 -m venv .venv
```

This creates an isolated environment in a local folder named `.venv`.

---

## 3. Activate the virtual environment

```bash
source .venv/bin/activate
```

If successful, your terminal prompt will change to something like:

```
(.venv) user@machine:~/nmapVibe$
```

---

## 4. Install dependencies

If the project includes a `requirements.txt` file:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

If not, install Flask manually:

```bash
pip install flask
```

---

## 5. Run the Flask application

**Option A: Direct Python execution**

```bash
python app.py
```

**Option B: Flask CLI**

```bash
export FLASK_APP=app.py
export FLASK_DEBUG=1
flask run --host=127.0.0.1 --port=5000
```

> **Note:** This app is designed for local use only. Never expose it to public networks.

---

## 6. Exit the virtual environment

When finished working:

```bash
deactivate
```

This returns you to the system Python environment.

---

## 7. Delete the virtual environment permanently

From inside the project directory:

```bash
rm -rf .venv
```

This completely removes the isolated Python environment.

> **Note:** The `.venv` folder is automatically ignored by git (see `.gitignore`), so it won't be uploaded to version control.
