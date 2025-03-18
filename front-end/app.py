from flask import Flask, request, jsonify, send_from_directory
import os
import cv2
import pytesseract
from ultralytics import YOLO
from flask_cors import CORS

app = Flask(__name__, static_folder='public', static_url_path='/public')
CORS(app)

@app.route('/public/<path:filename>')
def serve_static(filename):
    return send_from_directory('public', filename)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'best.pt')
model = YOLO(MODEL_PATH)

# Set path for Tesseract OCR (Ensure Tesseract is installed)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_geolocation(frame):
    """
    Extract latitude and longitude from the bottom of the frame using OCR.
    """
    height, width, _ = frame.shape
    cropped_frame = frame[height-50:height, 0:width]

    # Perform OCR to extract text
    text = pytesseract.image_to_string(cropped_frame)

    # Extract latitude and longitude using regex
    import re
    match = re.search(r'(\d+\.\d+)\s*,\s*(\d+\.\d+)', text)
    if match:
        latitude, longitude = match.groups()
        return float(latitude), float(longitude)
    return None

@app.route('/process_video', methods=['POST'])
def process_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    input_path = os.path.join('public', 'Input.mp4')

    # Ensure directory exists
    os.makedirs('public', exist_ok=True)
    video.save(input_path)
    print(f"📂 Video saved: {input_path}")

    cap = cv2.VideoCapture(input_path)

    if not cap.isOpened():
        return jsonify({'error': 'Failed to open video'}), 500

    frame_count = 0
    damage_locations = []
    location_file_path = os.path.join('public', 'damage_locations.txt')

    with open(location_file_path, 'w') as loc_file:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            results = model.predict(frame)
            damage_detected = False

            for result in results:
                for box in result.boxes.xyxy:
                    x1, y1, x2, y2 = map(int, box)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, "Damaged Track", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                    damage_detected = True

            if damage_detected:
                location = extract_geolocation(frame)
                if location:
                    latitude, longitude = location
                    damage_locations.append({'latitude': latitude, 'longitude': longitude})
                    cv2.putText(frame, f"Location: {latitude}, {longitude}", (10, frame.shape[0] - 20),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    loc_file.write(f"Frame {frame_count}: Latitude: {latitude}, Longitude: {longitude}\n")
                    print(f"Frame {frame_count}: Latitude: {latitude}, Longitude: {longitude}")

                # Save the damaged frame as an image
                damage_image_path = os.path.join('public', f'damage_frame_{frame_count}.jpg')
                cv2.imwrite(damage_image_path, frame)

    cap.release()
    print(f"✅ Damaged frames saved in public folder.")
    print(f"Damaged locations stored in {location_file_path}")

    return jsonify({'message': 'Processing complete', 'damage_locations': damage_locations})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    
