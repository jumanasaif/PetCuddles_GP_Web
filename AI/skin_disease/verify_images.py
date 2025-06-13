import os
from PIL import Image

def verify_images(dataset_path):
    bad_images = []
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with Image.open(file_path) as img:
                    img.verify()
                # Convert to JPG if not already
                if not file.lower().endswith(('.jpg', '.jpeg')):
                    new_path = os.path.splitext(file_path)[0] + '.jpg'
                    Image.open(file_path).convert('RGB').save(new_path, 'JPEG', quality=95)
                    os.remove(file_path)
                    print(f"Converted {file} to JPG")
            except Exception as e:
                bad_images.append(file_path)
                print(f"Bad image: {file_path} - {str(e)}")
                try:
                    os.remove(file_path)
                    print(f"Removed corrupted file: {file_path}")
                except:
                    pass
    return bad_images

dataset_path = os.path.join('datasets', 'dog')
print(f"Verifying images in {dataset_path}...")
bad_files = verify_images(dataset_path)
print(f"\nFound {len(bad_files)} problematic files")
print("Verification complete!")