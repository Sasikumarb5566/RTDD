import time
import requests

API_KEY = "e69aae7c777d394e7b9b2afee864e637"  # Replace with your Convertio API key
INPUT_FILE_PATH = r"C:\Users\offis\OneDrive\Desktop\Temp\front-end\public\Output.mp4"  # Replace with your MP4 file path
OUTPUT_FILE_NAME = "output.webm"

# Step 1: Upload the file
def upload_file():
    url = "https://api.convertio.co/convert"
    files = {'file': open(INPUT_FILE_PATH, 'rb')}
    data = {
        "apikey": API_KEY,
        "input": "upload",
        "outputformat": "webm"
    }
    
    try:
        response = requests.post(url, files=files, data=data)
        response.raise_for_status()
        print("File uploaded successfully.")
        return response.json()["data"]["id"]
    except requests.exceptions.RequestException as e:
        print(f"Error uploading the file: {e}")
        return None

# Step 2: Monitor the conversion status
def monitor_conversion(job_id):
    url = f"https://api.convertio.co/convert/{job_id}/status"
    headers = {"apikey": API_KEY}
    
    while True:
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            status_data = response.json()["data"]

            if status_data["step"] == "finish":
                print("Conversion completed.")
                return status_data["output"]["url"]
            elif status_data["step"] == "error":
                print("Conversion failed:", status_data.get("error", "Unknown error"))
                return None
            else:
                print(f"Conversion status: {status_data['step']}... Retrying in 5 seconds.")
        except requests.exceptions.RequestException as e:
            print(f"Error checking conversion status: {e}")
        time.sleep(5)

# Step 3: Download the converted file
def download_file(download_url):
    try:
        response = requests.get(download_url, stream=True)
        response.raise_for_status()
        with open(OUTPUT_FILE_NAME, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"File downloaded successfully as {OUTPUT_FILE_NAME}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the file: {e}")

# Main Function
def main():
    job_id = upload_file()
    if not job_id:
        return
    download_url = monitor_conversion(job_id)
    if download_url:
        download_file(download_url)

if __name__ == "__main__":
    main()
