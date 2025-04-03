from flask import Flask, request, jsonify, send_from_directory
import os
import cv2
import pytesseract
from ultralytics import YOLO
from flask_cors import CORS
import subprocess
from google.generativeai import GenerativeModel, configure
import base64
import json

app = Flask(__name__, static_folder='public', static_url_path='/public')
CORS(app)

@app.route('/public/<path:filename>')
def serve_static(filename):
    return send_from_directory('public', filename)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'best.pt')
model = YOLO(MODEL_PATH)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyCZYjZHfcXB-BsJcYbq0D4CVbyHAz5ktSc"  # Replace with your actual API key
configure(api_key=GEMINI_API_KEY)
# Use a currently supported model like "gemini-2.0-pro-vision" or "gemini-2.0-flash"
gemini_model = GenerativeModel("gemini-2.0-flash") # Or "gemini-2.0-flash"

# Set path for Tesseract OCR (Ensure Tesseract is installed)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def convert_to_webm(input_path, output_path):
    """Converts a video file to WebM format using FFmpeg."""
    try:
        command = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libvpx-vp9',
            '-crf', '30',
            '-b:v', '0',
            '-c:a', 'libopus',
            '-b:a', '128k',
            output_path
        ]
        subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✅ Successfully converted {input_path} to {output_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error converting video: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Error: FFmpeg not found. Please ensure FFmpeg is installed and in your system's PATH.")
        return False

def send_video_to_gemini(video_path):
    """Sends the processed video to Gemini for location extraction."""
    try:
        with open(video_path, "rb") as video_file:
            video_data = base64.b64encode(video_file.read()).decode('utf-8')

        prompt = (
            "Analyze the video of a railway track to identify the latitude and longitude of any damaged tracks marked in the video. "
            "Return all the location data in a single JSON file containing a list of unique locations in the format: "
            "{'locations': [{'latitude': '...', 'longitude': '...'}, ...]}.\n\n"
            "If multiple damages are detected at the same coordinates, include only one instance of each location."
        )

        response = gemini_model.generate_content(
            [prompt, {"mime_type": "video/webm", "data": video_data}]
        )

        if response.text:
            print(f"🔍 Raw Gemini Response: {response.text}") # Debugging

            # Remove ```json and any surrounding whitespace
            cleaned_response = response.text.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[len("```json"):].strip()
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-len("```")].strip()

            return cleaned_response  # Return the cleaned JSON string
        else:
            print("⚠️ Gemini returned an empty response.")
            return None

    except Exception as e:
        print(f"⚠️ Error sending video to Gemini: {e}")
        return None
    
    
@app.route('/process_video', methods=['POST'])
def process_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    input_path = os.path.join('public', 'Input.mp4')
    output_path = os.path.join('public', 'Output_raw.mp4') # Save the raw output first
    final_output_path = os.path.join('public', 'Output.webm') # Final playable output in WebM
    gemini_response_path = os.path.join('public', 'gemini_response.json')

    # Ensure directory exists
    os.makedirs('public', exist_ok=True)
    video.save(input_path)
    print(f"📂 Video saved: {input_path}")

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return jsonify({'error': 'Failed to open video'}), 500

    frame_width = int(cap.get(3))
    frame_height = int(cap.get(4))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, 30.0, (frame_width, frame_height))

    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        results = model.predict(frame)

        for result in results:
            for box in result.boxes.xyxy:
                x1, y1, x2, y2 = map(int, box)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, "Damaged Track", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        out.write(frame)

    cap.release()
    out.release()
    print(f"✅ Raw output video saved to {output_path}")

    # Convert the raw output to a playable WebM
    if convert_to_webm(output_path, final_output_path):
        print(f"✅ Processed video saved to {final_output_path}")
        # Send the processed video to Gemini for location extraction
        gemini_response_text = send_video_to_gemini(final_output_path)

        if gemini_response_text:
            gemini_response_path = os.path.join('public', 'gemini_response.json')
            try:
                with open(gemini_response_path, 'w') as f:
                    f.write(gemini_response_text)
                print(f"📄 Gemini response saved to {gemini_response_path}")
            except Exception as e:
                print(f"⚠️ Error saving Gemini response to JSON file: {e}")

            # Optionally, you can still parse it to send location data to the frontend
            try:
                location_data = json.loads(gemini_response_text).get('locations', [])
            except json.JSONDecodeError:
                location_data = {"error": "Could not parse Gemini response"}

            return jsonify({'message': 'Processing complete', 'output_video': '/public/Output.webm', 'location_data': location_data, 'gemini_response_file': '/public/gemini_response.json'})
        else:
            return jsonify({'error': 'Failed to convert output video to a playable format'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)