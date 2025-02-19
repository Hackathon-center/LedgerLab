import boto3
import os
import requests
from PIL import Image
from io import BytesIO
import pandas as pd
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Initialize AWS clients
session = boto3.Session(
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

rekognition = session.client('rekognition')
textract = session.client('textract')
comprehend = session.client('comprehend')

# Create directories
IMAGE_DIR = 'sample_images'
os.makedirs(IMAGE_DIR, exist_ok=True)

# CSV file path
CSV_FILE = "../scrapper/memes_posts.csv"

# Download and save the images from url column
def download_and_save_image(url, save_path):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status() 
        img = Image.open(BytesIO(response.content))
        img.save(save_path)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False


# Download and save images to dir 
def process_csv():
    print("Processing CSV file...")
    df = pd.read_csv(CSV_FILE)
    for idx, row in df.iterrows():
        url = row['url']
        save_path = os.path.join(IMAGE_DIR, f"image_{idx}.jpg")
        if not os.path.exists(save_path):
            success = download_and_save_image(url, save_path)
            if success:
                print(f"Successfully downloaded: {url}")
            else:
                print(f"Failed to download: {url}")
        else:
            print(f"Image already exists: {save_path}")


# Watchdog event handler
class CsvChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(CSV_FILE):
            print("CSV file has been modified. Reprocessing...")
            process_csv()

if __name__ == "__main__":
    process_csv()
    
    # Watchdog observer
    event_handler = CsvChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=os.path.dirname(CSV_FILE), recursive=False)
    observer.start()
    
    # Stop function
    try:
        print("Monitoring CSV file for changes. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()