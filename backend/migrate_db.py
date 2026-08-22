import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'license_platform.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check tenants table
cursor.execute('PRAGMA table_info(tenants);')
cols = [row[1] for row in cursor.fetchall()]
print('Existing tenant columns:', cols)

new_cols = [
    ('industry_code', 'TEXT DEFAULT "RETAIL_ELECTRONICS"'),
    ('configuration_version', 'TEXT DEFAULT "2026.1.0"'),
    ('capabilities_override', 'TEXT DEFAULT "{}"')
]

for col_name, col_def in new_cols:
    if col_name not in cols:
        print(f'Adding {col_name} to tenants table...')
        cursor.execute(f'ALTER TABLE tenants ADD COLUMN {col_name} {col_def};')

conn.commit()
conn.close()
print('Migration finished successfully.')
