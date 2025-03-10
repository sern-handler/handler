import os

for root, dirs, files in os.walk('.'):
    for filename in files:
        if filename.endswith('.js'):
            file_path = os.path.join(root, filename)
            try:
                os.remove(file_path)
                print(f'Successfully deleted: {file_path}')
            except OSError as e:
                print(f'Error deleting {file_path}: {e.strerror}')
