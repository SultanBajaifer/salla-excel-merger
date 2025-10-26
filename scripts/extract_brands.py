#!/usr/bin/env python3
"""
Brand extraction script for Salla Excel Merger.
This script:
- Detects brand names from the product column (المنتج)
- Returns detected brands to the frontend
- Filters products by selected brands
"""

import pandas as pd
import sys
import os
import io
import locale
import json
import re
from collections import Counter

# Set UTF-8 encoding for stdout
if sys.stdout.encoding != 'UTF-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr.encoding != 'UTF-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set locale to handle Arabic characters
try:
    locale.setlocale(locale.LC_ALL, 'ar_SA.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    except:
        pass


def detect_brands(file_path, product_column_name='المنتج', min_frequency=2):
    """
    Detect brand names from the product column in an Excel file.
    
    Args:
        file_path: Path to the Excel file
        product_column_name: Name of the product column (default: 'المنتج')
        min_frequency: Minimum frequency for a brand to be detected (default: 2)
        
    Returns:
        List of detected brand names with their frequencies
    """
    try:
        # Read the Excel file
        xls = pd.ExcelFile(file_path)
        sheet_name = xls.sheet_names[0]
        df = pd.read_excel(xls, sheet_name=sheet_name)
        
        # Find the product column
        product_col = None
        for col in df.columns:
            if product_column_name in str(col):
                product_col = col
                break
        
        if product_col is None:
            return {
                'success': False,
                'error': f'لم يتم العثور على عمود "{product_column_name}" في الملف'
            }
        
        # Extract all product names and clean them
        products = df[product_col].dropna().astype(str)
        
        if len(products) == 0:
            return {
                'success': False,
                'error': 'لا توجد منتجات في العمود المحدد'
            }
        
        # Detect brands using word frequency analysis
        # Split each product name into words and count occurrences
        word_counter = Counter()
        
        for product in products:
            # Clean the product name: remove extra spaces, special characters
            product = product.strip()
            
            # Split by common delimiters (space, dash, comma, etc.)
            words = re.split(r'[\s\-،,/\\|]+', product)
            
            # Filter out very short words (less than 2 chars) and numbers
            words = [w.strip() for w in words if len(w.strip()) >= 2 and not w.strip().isdigit()]
            
            # Count first 3 words (brands usually appear at the beginning)
            for word in words[:3]:
                if word:
                    word_counter[word] += 1
        
        # Get top brands (words that appear at least min_frequency times)
        detected_brands = []
        for brand, count in word_counter.most_common(50):  # Limit to top 50
            if count >= min_frequency:
                detected_brands.append({
                    'name': brand,
                    'count': count
                })
        
        if len(detected_brands) == 0:
            # If no brands detected with min_frequency, return top 10 words
            for brand, count in word_counter.most_common(10):
                detected_brands.append({
                    'name': brand,
                    'count': count
                })
        
        return {
            'success': True,
            'brands': detected_brands,
            'product_column': str(product_col),
            'total_products': len(products)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'خطأ في قراءة الملف: {str(e)}'
        }


def extract_by_brands(file_path, selected_brands, product_column_name='المنتج'):
    """
    Extract products that belong to selected brands.
    
    Args:
        file_path: Path to the Excel file
        selected_brands: List of brand names to extract
        product_column_name: Name of the product column (default: 'المنتج')
        
    Returns:
        Path to the filtered Excel file
    """
    try:
        # Read the Excel file
        xls = pd.ExcelFile(file_path)
        sheet_name = xls.sheet_names[0]
        df = pd.read_excel(xls, sheet_name=sheet_name)
        
        # Find the product column
        product_col = None
        for col in df.columns:
            if product_column_name in str(col):
                product_col = col
                break
        
        if product_col is None:
            raise ValueError(f'لم يتم العثور على عمود "{product_column_name}" في الملف')
        
        # Filter rows that contain any of the selected brands
        def contains_brand(product_name):
            if pd.isna(product_name):
                return False
            product_str = str(product_name)
            for brand in selected_brands:
                # Case-insensitive search for the brand in the product name
                if brand in product_str or brand.lower() in product_str.lower():
                    return True
            return False
        
        # Apply filter
        filtered_df = df[df[product_col].apply(contains_brand)]
        
        if len(filtered_df) == 0:
            raise ValueError('لم يتم العثور على أي منتجات تحتوي على العلامات المحددة')
        
        # Generate output path
        base, ext = os.path.splitext(file_path)
        output_path = f"{base}_filtered_brands.xlsx"
        
        # Save the filtered file
        filtered_df.to_excel(output_path, index=False, engine='openpyxl')
        
        # Print the result as JSON
        result = {
            'success': True,
            'output_path': output_path,
            'filtered_count': len(filtered_df),
            'total_count': len(df)
        }
        print(json.dumps(result, ensure_ascii=False))
        
        return output_path
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': f'خطأ في تصفية الملف: {str(e)}'
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'الاستخدام: python extract_brands.py <action> <file_path> [params]'
        }, ensure_ascii=False))
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == 'detect':
        # Detect brands mode
        if len(sys.argv) < 3:
            print(json.dumps({
                'success': False,
                'error': 'يرجى تحديد مسار الملف'
            }, ensure_ascii=False))
            sys.exit(1)
        
        file_path = sys.argv[2]
        
        if not os.path.exists(file_path):
            print(json.dumps({
                'success': False,
                'error': f'الملف غير موجود: {file_path}'
            }, ensure_ascii=False))
            sys.exit(1)
        
        # Detect brands
        result = detect_brands(file_path)
        print(json.dumps(result, ensure_ascii=False))
        
        if not result['success']:
            sys.exit(1)
    
    elif action == 'extract':
        # Extract by brands mode
        if len(sys.argv) < 4:
            print(json.dumps({
                'success': False,
                'error': 'يرجى تحديد مسار الملف والعلامات التجارية'
            }, ensure_ascii=False))
            sys.exit(1)
        
        file_path = sys.argv[2]
        selected_brands_json = sys.argv[3]
        
        if not os.path.exists(file_path):
            print(json.dumps({
                'success': False,
                'error': f'الملف غير موجود: {file_path}'
            }, ensure_ascii=False))
            sys.exit(1)
        
        # Parse selected brands
        try:
            selected_brands = json.loads(selected_brands_json)
        except json.JSONDecodeError:
            print(json.dumps({
                'success': False,
                'error': 'خطأ في تحليل العلامات التجارية المحددة'
            }, ensure_ascii=False))
            sys.exit(1)
        
        # Extract by brands
        extract_by_brands(file_path, selected_brands)
    
    else:
        print(json.dumps({
            'success': False,
            'error': f'الإجراء غير معروف: {action}. استخدم "detect" أو "extract"'
        }, ensure_ascii=False))
        sys.exit(1)
