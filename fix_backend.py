import os
import glob

files = glob.glob('backend/**/*.py', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = content.replace('\\\"', '\"')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
        
print("Fixed backend files.")
