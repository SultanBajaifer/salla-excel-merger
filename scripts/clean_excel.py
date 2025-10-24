#!/usr/bin/env python3
"""
Excel file cleaning script for Salla Excel Merger.
This script cleans Excel files by:
- Detecting the first valid header row
- Removing empty rows and columns
- Cleaning spaces, newlines, and special characters
"""

import pandas as pd
import sys
import os


def clean_excel(file_path):
    """
    Clean an Excel file by removing empty rows/columns and detecting headers.
    
    Args:
        file_path: Path to the Excel file to clean
        
    Returns:
        Path to the cleaned file
    """
    try:
        # Read the Excel file without assuming a header
        xls = pd.ExcelFile(file_path)
        sheet_name = xls.sheet_names[0]
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # Find the first row with at least 3 non-empty cells (header row)
        header_row_idx = None
        for i, row in df.iterrows():
            non_empty_count = row.count()
            if non_empty_count >= 3:
                header_row_idx = i
                break
        
        if header_row_idx is None:
            # If no valid header found, use the first row
            header_row_idx = 0
        
        # Set the detected row as column headers
        df.columns = df.iloc[header_row_idx].astype(str).str.replace(r'\s+', ' ', regex=True).str.strip()
        
        # Remove the header row and everything before it
        df = df.iloc[header_row_idx + 1:]
        
        # Drop completely empty rows
        df = df.dropna(how='all', axis=0)
        
        # Drop completely empty columns
        df = df.dropna(how='all', axis=1)
        
        # Clean all cell values: trim whitespace and replace newlines
        df = df.map(lambda x: str(x).strip().replace('\r', ' ').replace('\n', ' ') if isinstance(x, str) else x)
        
        # Reset index
        df = df.reset_index(drop=True)
        
        # Generate output path
        base, ext = os.path.splitext(file_path)
        cleaned_path = f"{base}_cleaned.xlsx"
        
        # Save the cleaned file
        df.to_excel(cleaned_path, index=False, engine='openpyxl')
        
        # Print the path to stdout (will be captured by Node.js)
        print(cleaned_path)
        
        return cleaned_path
        
    except Exception as e:
        print(f"Error cleaning Excel file: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python clean_excel.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    
    clean_excel(file_path)
