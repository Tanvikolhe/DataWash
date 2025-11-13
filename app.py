from flask import Flask, request, jsonify, render_template
import io
from cleaner import clean_csv_data 

app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "No file", 400
    file = request.files['file']
    if file.filename == '':
        return "No file", 400

    if file:
        stream = io.StringIO(file.stream.read().decode("UTF-8"), newline=None)
        result = clean_csv_data(stream)
        return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)