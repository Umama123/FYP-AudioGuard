import sqlite3, json
def main():
    db = 'data/activity.db'
    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    output = {}
    tables = ['detections', 'enhancements', 'watermarks', 'reports']
    for t in tables:
        try:
            output[t] = [dict(r) for r in conn.execute(f'SELECT * FROM {t} LIMIT 50').fetchall()]
        except Exception as e:
            output[t] = []
    
    with open("db_records.json", "w") as f:
        json.dump(output, f, indent=2)
        
    print("Exported to db_records.json")

if __name__ == '__main__':
    main()
