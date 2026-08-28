import sys, os
from sqlalchemy import inspect, text

sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine, Base
import app.models

inspector = inspect(engine)

with engine.connect() as conn:
    for table_name, table in Base.metadata.tables.items():
        if not inspector.has_table(table_name):
            print(f"Creating entire table {table_name}...")
            table.create(bind=engine, checkfirst=True)
            continue
        existing_cols = {c['name'] for c in inspector.get_columns(table_name)}
        for col in table.columns:
            if col.name not in existing_cols:
                col_type = col.type.compile(engine.dialect)
                stmt = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type};'
                print(f"Applying: {stmt}")
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception as e:
                    print(f"Error applying {stmt}: {e}")
                    conn.rollback()

print("Schema inspection and column sync complete!")
