import os
from PIL import Image
from tqdm import tqdm

def convert_avif_to_jpg(dataset_path):
    converted = 0
    for root, dirs, files in os.walk(dataset_path):
        for file in tqdm(files, desc="Converting images"):
            file_path = os.path.join(root, file)
            try:
                if file.lower().endswith('.avif'):
                    # Convert AVIF to JPG
                    output_path = os.path.join(root, file.split('.')[0] + '.jpg')
                    with Image.open(file_path) as img:
                        img.convert('RGB').save(output_path, 'JPEG')
                    os.remove(file_path)
                    converted += 1
                elif file.lower().endswith(('.png', '.webp')):
                    # Convert other formats to JPG too for consistency
                    output_path = os.path.join(root, file.split('.')[0] + '.jpg')
                    with Image.open(file_path) as img:
                        img.convert('RGB').save(output_path, 'JPEG')
                    os.remove(file_path)
                    converted += 1
            except Exception as e:
                print(f"Error converting {file_path}: {str(e)}")
                continue
    return converted

if __name__ == '__main__':
    dataset_path = os.path.join('datasets', 'dog')
    print(f"Converting images in {dataset_path}...")
    converted = convert_avif_to_jpg(dataset_path)
    print(f"Converted {converted} images to JPG format")
