# DataWash
# DataWash - Intelligent ETL & Data Cleaning Dashboard

## 🚀 Project Overview
**DataWash** is a full-stack Data Engineering application designed to streamline the ETL (Extract, Transform, Load) process. It allows users to upload raw, messy CSV datasets and automatically cleans them by handling missing values, removing duplicates, and standardizing data types.

## ✨ Key Features
* **⚡ Automated ETL:** Instantly parses CSVs, detects data types, and sanitizes inputs using Pandas.
* **📊 Interactive Dashboard:** Split-screen view with a live editable table and dynamic bar charts.
* **🔍 Deep Dive Insights:** Automatic analysis of numerical (Min/Max/Avg) and categorical (Frequency/Pie Chart) columns.
* **🌗 Dark Mode:** Fully responsive UI with a persistent dark mode toggle.
* **📜 Session History:** Tracks uploaded files and allows reverting to previous cleaning states.

## 🛠️ Tech Stack
* **Backend:** Python, Flask, Pandas, NumPy
* **Frontend:** HTML5, CSS3 (Grid/Flexbox), JavaScript (ES6+)
* **Visualization:** Chart.js

## ⚙️ How to Run Locally
1.  Clone the repository or download the ZIP.
2.  Install dependencies: `pip install flask pandas numpy`
3.  Run the app: `python app.py`
4.  Open `http://127.0.0.1:5000`
