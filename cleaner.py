import pandas as pd
import io
import numpy as np # We need numpy to handle NaNs

def clean_csv_data(input_file_stream):
    try:
        # 1. EXTRACT
        df = pd.read_csv(input_file_stream)
        
        # Stats before cleaning
        original_rows = len(df)
        original_cols = len(df.columns)
        missing_before = int(df.isnull().sum().sum())

        # 2. TRANSFORM (Basic Cleaning)
        # Clean headers
        df.columns = df.columns.str.strip()
        
        # Auto-clean text columns
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].str.strip()
        
        # Auto-fill numeric missing values
        # (We fill with 0 if the mean is NaN - e.g., if column is all empty)
        for col in df.select_dtypes(include=['number']).columns:
            mean_val = df[col].mean()
            if pd.isna(mean_val):
                mean_val = 0
            df[col] = df[col].fillna(mean_val)

        # Remove duplicates
        duplicates = int(df.duplicated().sum())
        df = df.drop_duplicates()

        # 3. SAFE LOAD PREPARATION
        # IMPORTANT: Replace any remaining NaNs/Infs with None (becomes null in JSON)
        # Otherwise, Flask will crash when creating the JSON response.
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notnull(df), None)

        # Convert to list of dictionaries
        json_data = df.to_dict(orient='records')
        
        return {
            "data": json_data,
            "stats": {
                "rows": len(df),
                "cols": len(df.columns),
                "duplicates": duplicates,
                "missing_filled": missing_before
            }
        }
    except Exception as e:
        print(f"❌ CLEANER ERROR: {e}") # Print error to your terminal
        raise e # Re-raise to let Flask handle it