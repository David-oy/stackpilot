from pathlib import Path
import pandas as pd

OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

def save_csv(data, filename):
    df = pd.DataFrame(data)
    df.to_csv(OUTPUT_DIR / filename, index=False)

def log(message):
    print(message)
    with open(OUTPUT_DIR / "logs.txt", "a", encoding="utf-8") as f:
        f.write(message + "\n")