"""Extract MiningProcess CSV from the Google Drive zip bundle."""
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "data"
ARCHIVE = BASE / "Mining_Process_Flotation_Plant_Database.csv"
OUT = BASE / "extracted2" / "MiningProcess_Flotation_Plant_Database.csv"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        print(f"Already extracted: {OUT}")
        return
    if not ARCHIVE.exists():
        raise SystemExit(f"Archive not found: {ARCHIVE}. Download from Google Drive first.")

    with zipfile.ZipFile(ARCHIVE) as outer:
        outer.extractall(BASE / "extracted")
    inner = (
        BASE
        / "extracted"
        / "Project10"
        / "Project10_Quality Prediction in a Mining Process.zip"
    )
    with zipfile.ZipFile(inner) as z:
        z.extractall(BASE / "extracted2")
    print(f"Extracted dataset to {OUT}")


if __name__ == "__main__":
    main()
