import os
import glob

files = glob.glob('src/**/*.jsx', recursive=True) + glob.glob('src/**/*.css', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace literal backslash followed by quote with just a quote
    new_content = content.replace('\\\"', '\"')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
        
print("Fixed files again.")
