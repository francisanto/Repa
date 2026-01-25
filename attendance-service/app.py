"""
AI-Powered Attendance Analysis Service
Handles OCR, semantic analysis, clustering, and anomaly detection for leave letters
"""
import os
import json
import base64
import io
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
from pdf2image import convert_from_bytes
from paddleocr import PaddleOCR
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

app = Flask(__name__)
CORS(app)

# Initialize models (lazy loading)
ocr_engine = None
embedding_model = None

def get_ocr_engine():
    """Lazy load OCR engine"""
    global ocr_engine
    if ocr_engine is None:
        print("Initializing PaddleOCR...")
        ocr_engine = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            use_gpu=False,
            show_log=False
        )
    return ocr_engine

def get_embedding_model():
    """Lazy load Sentence-BERT model"""
    global embedding_model
    if embedding_model is None:
        print("Loading Sentence-BERT model (all-MiniLM-L6-v2)...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    return embedding_model

def pdf_to_images(pdf_bytes: bytes) -> List[Image.Image]:
    """Convert PDF bytes to list of PIL Images"""
    try:
        images = convert_from_bytes(pdf_bytes, dpi=200)
        return images
    except Exception as e:
        raise Exception(f"Failed to convert PDF: {str(e)}")

def extract_text_with_ocr(image: Image.Image) -> str:
    """Extract text from image using PaddleOCR with table and layout support"""
    ocr = get_ocr_engine()
    
    # Convert PIL Image to numpy array
    img_array = np.array(image)
    
    # Run OCR
    result = ocr.ocr(img_array, cls=True)
    
    # Extract text from all detected regions
    text_lines = []
    if result and result[0]:
        for line in result[0]:
            if line and len(line) >= 2:
                text = line[1][0] if isinstance(line[1], (list, tuple)) else line[1]
                confidence = line[1][1] if isinstance(line[1], (list, tuple)) and len(line[1]) > 1 else 1.0
                if confidence > 0.5:  # Filter low confidence
                    text_lines.append(text)
    
    return "\n".join(text_lines)

def clean_text(text: str) -> str:
    """Clean and normalize OCR output"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?;:()\-\']', '', text)
    # Normalize quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace("'", "'").replace("'", "'")
    return text.strip()

def extract_leave_letter_data(text: str) -> Dict[str, Any]:
    """Extract structured data from leave letter text"""
    # Normalize text for extraction
    text_lower = text.lower()
    
    # Extract student name (look for patterns like "Name:", "I, [Name]", "Student Name:")
    name_patterns = [
        r'(?:name|student name|name of student)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        r'(?:i|this is to inform)[\s,]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        r'([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+roll|roll\s+no)',
    ]
    student_name = None
    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            student_name = match.group(1).strip()
            break
    
    # Extract roll number
    roll_patterns = [
        r'(?:roll|roll\s+no|roll\s+number|reg\s+no)[\s:]+([A-Z0-9\-]+)',
        r'([A-Z]{2,}\d{2,}[A-Z0-9]*)',
    ]
    roll_number = None
    for pattern in roll_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            roll_number = match.group(1).strip()
            break
    
    # Extract date
    date_patterns = [
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})',
    ]
    date_str = None
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1).strip()
            break
    
    # Extract leave reason (main text content)
    # Remove headers, signatures, and common phrases
    reason_keywords = ['leave', 'absent', 'unable', 'request', 'permission', 'due to', 'because']
    lines = text.split('\n')
    reason_lines = []
    in_reason_section = False
    
    for line in lines:
        line_lower = line.lower().strip()
        # Skip empty lines and common headers
        if not line_lower or len(line_lower) < 10:
            continue
        if any(keyword in line_lower for keyword in ['respectfully', 'yours', 'sincerely', 'signature', 'date:', 'name:']):
            break
        if any(keyword in line_lower for keyword in reason_keywords):
            in_reason_section = True
        if in_reason_section or len(reason_lines) > 0:
            reason_lines.append(line)
    
    reason = ' '.join(reason_lines[:5])  # Take first 5 relevant lines
    if not reason or len(reason) < 20:
        # Fallback: take middle section of text
        mid_start = len(text) // 4
        mid_end = 3 * len(text) // 4
        reason = text[mid_start:mid_end]
    
    reason = clean_text(reason)
    
    return {
        'student_name': student_name,
        'roll_number': roll_number,
        'date': date_str,
        'reason': reason,
        'raw_text': text
    }

def compute_embeddings(reasons: List[str]) -> np.ndarray:
    """Compute semantic embeddings for leave reasons"""
    model = get_embedding_model()
    embeddings = model.encode(reasons, show_progress_bar=False)
    return embeddings

def cluster_reasons(embeddings: np.ndarray, n_clusters: Optional[int] = None) -> np.ndarray:
    """Cluster similar leave reasons using KMeans"""
    if len(embeddings) < 2:
        return np.array([0] * len(embeddings))
    
    # Determine optimal number of clusters
    if n_clusters is None:
        n_clusters = min(max(2, len(embeddings) // 3), 10)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(embeddings)
    return clusters

def compute_similarity_matrix(embeddings: np.ndarray) -> np.ndarray:
    """Compute pairwise cosine similarity matrix"""
    return cosine_similarity(embeddings)

def detect_anomalies(
    leave_letters: List[Dict[str, Any]],
    embeddings: np.ndarray,
    similarity_matrix: np.ndarray,
    clusters: np.ndarray
) -> List[Dict[str, Any]]:
    """Detect attendance anomalies"""
    anomalies = []
    threshold_high_similarity = 0.85
    threshold_medium_similarity = 0.75
    
    # 1. Detect highly similar or copied leave reasons
    for i in range(len(leave_letters)):
        for j in range(i + 1, len(leave_letters)):
            similarity = similarity_matrix[i][j]
            if similarity >= threshold_high_similarity:
                anomalies.append({
                    'type': 'high_similarity',
                    'risk_level': 'high',
                    'description': f'Leave reasons are highly similar (similarity: {similarity:.2f})',
                    'students': [
                        {
                            'name': leave_letters[i].get('student_name', 'Unknown'),
                            'roll_number': leave_letters[i].get('roll_number', 'N/A'),
                            'date': leave_letters[i].get('date', 'N/A'),
                            'reason': leave_letters[i].get('reason', '')[:100]
                        },
                        {
                            'name': leave_letters[j].get('student_name', 'Unknown'),
                            'roll_number': leave_letters[j].get('roll_number', 'N/A'),
                            'date': leave_letters[j].get('date', 'N/A'),
                            'reason': leave_letters[j].get('reason', '')[:100]
                        }
                    ],
                    'similarity_score': float(similarity)
                })
    
    # 2. Detect repeated excuses by same student
    student_excuses = {}
    for idx, letter in enumerate(leave_letters):
        student_id = letter.get('roll_number') or letter.get('student_name', 'unknown')
        if student_id not in student_excuses:
            student_excuses[student_id] = []
        student_excuses[student_id].append({
            'index': idx,
            'date': letter.get('date', 'N/A'),
            'reason': letter.get('reason', '')
        })
    
    for student_id, excuses in student_excuses.items():
        if len(excuses) >= 2:
            # Check if reasons are similar
            if len(excuses) == 2:
                idx1, idx2 = excuses[0]['index'], excuses[1]['index']
                similarity = similarity_matrix[idx1][idx2]
                if similarity >= threshold_medium_similarity:
                    anomalies.append({
                        'type': 'repeated_excuse',
                        'risk_level': 'medium',
                        'description': f'Student submitted {len(excuses)} similar leave requests',
                        'student': {
                            'name': leave_letters[excuses[0]['index']].get('student_name', 'Unknown'),
                            'roll_number': student_id
                        },
                        'excuses': [
                            {'date': e['date'], 'reason': e['reason'][:100]} 
                            for e in excuses
                        ],
                        'similarity_score': float(similarity)
                    })
            else:
                anomalies.append({
                    'type': 'repeated_excuse',
                    'risk_level': 'high',
                    'description': f'Student submitted {len(excuses)} leave requests',
                    'student': {
                        'name': leave_letters[excuses[0]['index']].get('student_name', 'Unknown'),
                        'roll_number': student_id
                    },
                    'excuse_count': len(excuses)
                })
    
    # 3. Detect unusually large groups sharing same reason on same date
    date_groups = {}
    for idx, letter in enumerate(leave_letters):
        date = letter.get('date', 'unknown')
        cluster_id = int(clusters[idx])
        key = f"{date}_{cluster_id}"
        if key not in date_groups:
            date_groups[key] = []
        date_groups[key].append(idx)
    
    for key, indices in date_groups.items():
        if len(indices) >= 5:  # 5 or more students with similar reason on same date
            date, cluster_id = key.split('_')
            cluster_reasons_list = [leave_letters[i].get('reason', '') for i in indices]
            avg_similarity = np.mean([
                similarity_matrix[i][j] 
                for i in indices 
                for j in indices 
                if i < j
            ]) if len(indices) > 1 else 1.0
            
            anomalies.append({
                'type': 'large_group',
                'risk_level': 'high',
                'description': f'{len(indices)} students submitted similar leave reasons on {date}',
                'date': date,
                'student_count': len(indices),
                'students': [
                    {
                        'name': leave_letters[i].get('student_name', 'Unknown'),
                        'roll_number': leave_letters[i].get('roll_number', 'N/A')
                    }
                    for i in indices
                ],
                'average_similarity': float(avg_similarity),
                'representative_reason': cluster_reasons_list[0][:150] if cluster_reasons_list else ''
            })
    
    # 4. Detect vague or generic reasons
    vague_keywords = ['personal', 'urgent', 'important', 'necessary', 'unavoidable', 'circumstances']
    generic_phrases = ['due to personal reasons', 'due to unavoidable circumstances', 'urgent work']
    
    for idx, letter in enumerate(leave_letters):
        reason = letter.get('reason', '').lower()
        vague_count = sum(1 for keyword in vague_keywords if keyword in reason)
        is_generic = any(phrase in reason for phrase in generic_phrases)
        
        if vague_count >= 2 or is_generic or len(reason) < 30:
            anomalies.append({
                'type': 'vague_reason',
                'risk_level': 'low',
                'description': 'Leave reason is vague or generic',
                'student': {
                    'name': letter.get('student_name', 'Unknown'),
                    'roll_number': letter.get('roll_number', 'N/A'),
                    'date': letter.get('date', 'N/A')
                },
                'reason': letter.get('reason', '')[:150],
                'vague_keyword_count': vague_count,
                'is_generic': is_generic
            })
    
    return anomalies

def generate_insights(
    leave_letters: List[Dict[str, Any]],
    clusters: np.ndarray,
    anomalies: List[Dict[str, Any]]
) -> List[str]:
    """Generate AI-powered insights"""
    insights = []
    
    # Cluster statistics
    unique_clusters = len(set(clusters))
    total_letters = len(leave_letters)
    insights.append(f"Analyzed {total_letters} leave letters and identified {unique_clusters} distinct reason categories.")
    
    # Anomaly summary
    high_risk = sum(1 for a in anomalies if a.get('risk_level') == 'high')
    medium_risk = sum(1 for a in anomalies if a.get('risk_level') == 'medium')
    low_risk = sum(1 for a in anomalies if a.get('risk_level') == 'low')
    
    if high_risk > 0:
        insights.append(f"⚠️ {high_risk} high-risk anomalies detected requiring immediate review.")
    if medium_risk > 0:
        insights.append(f"⚠️ {medium_risk} medium-risk cases flagged for verification.")
    if low_risk > 0:
        insights.append(f"ℹ️ {low_risk} low-risk cases (vague reasons) identified.")
    
    # Most common reasons
    if unique_clusters > 0:
        cluster_counts = {}
        for cluster_id in clusters:
            cluster_counts[cluster_id] = cluster_counts.get(cluster_id, 0) + 1
        most_common_cluster = max(cluster_counts.items(), key=lambda x: x[1])
        insights.append(f"Most common leave category: {most_common_cluster[1]} students ({most_common_cluster[1]/total_letters*100:.1f}%).")
    
    # Date patterns
    dates = [letter.get('date', '') for letter in leave_letters if letter.get('date')]
    if dates:
        date_counts = {}
        for date in dates:
            date_counts[date] = date_counts.get(date, 0) + 1
        max_date_count = max(date_counts.values()) if date_counts else 0
        if max_date_count >= 3:
            max_date = max(date_counts.items(), key=lambda x: x[1])[0]
            insights.append(f"Peak leave date: {max_date} with {max_date_count} requests.")
    
    return insights

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'attendance-analysis'})

@app.route('/api/process-leave-letter', methods=['POST'])
def process_leave_letter():
    """Process a single leave letter (image or PDF)"""
    try:
        data = request.json
        if not data or 'file' not in data:
            return jsonify({'error': 'File data required'}), 400
        
        # Decode base64 file
        file_data = data['file']
        if file_data.startswith('data:'):
            file_data = file_data.split(',')[1]
        file_bytes = base64.b64decode(file_data)
        
        # Determine file type and convert to image(s)
        images = []
        if file_bytes.startswith(b'%PDF'):
            # PDF file
            images = pdf_to_images(file_bytes)
        else:
            # Image file
            image = Image.open(io.BytesIO(file_bytes))
            images = [image]
        
        if not images:
            return jsonify({'error': 'Failed to process file'}), 400
        
        # Extract text from first image (or combine all)
        all_text = []
        for img in images:
            text = extract_text_with_ocr(img)
            all_text.append(text)
        
        combined_text = '\n'.join(all_text)
        cleaned_text = clean_text(combined_text)
        
        # Extract structured data
        extracted_data = extract_leave_letter_data(cleaned_text)
        
        return jsonify({
            'success': True,
            'data': extracted_data,
            'raw_text': cleaned_text
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-leave-letters', methods=['POST'])
def analyze_leave_letters():
    """Analyze multiple leave letters for clustering and anomaly detection"""
    try:
        data = request.json
        if not data or 'leave_letters' not in data:
            return jsonify({'error': 'leave_letters array required'}), 400
        
        leave_letters = data['leave_letters']
        if not isinstance(leave_letters, list) or len(leave_letters) == 0:
            return jsonify({'error': 'leave_letters must be a non-empty array'}), 400
        
        # Extract reasons
        reasons = [letter.get('reason', '') for letter in leave_letters]
        if not any(reasons):
            return jsonify({'error': 'No leave reasons found in letters'}), 400
        
        # Compute embeddings
        embeddings = compute_embeddings(reasons)
        
        # Cluster reasons
        clusters = cluster_reasons(embeddings)
        
        # Compute similarity matrix
        similarity_matrix = compute_similarity_matrix(embeddings)
        
        # Detect anomalies
        anomalies = detect_anomalies(leave_letters, embeddings, similarity_matrix, clusters)
        
        # Group by clusters
        grouped_categories = {}
        for idx, cluster_id in enumerate(clusters):
            cluster_id_str = str(int(cluster_id))
            if cluster_id_str not in grouped_categories:
                grouped_categories[cluster_id_str] = {
                    'category_id': cluster_id_str,
                    'representative_reason': reasons[idx],
                    'student_count': 0,
                    'students': [],
                    'average_similarity': 0.0
                }
            
            student_info = {
                'name': leave_letters[idx].get('student_name', 'Unknown'),
                'roll_number': leave_letters[idx].get('roll_number', 'N/A'),
                'date': leave_letters[idx].get('date', 'N/A'),
                'reason': reasons[idx],
                'similarity_scores': {}
            }
            
            # Add similarity scores with other students in same cluster
            for other_idx, other_cluster_id in enumerate(clusters):
                if other_cluster_id == cluster_id and idx != other_idx:
                    similarity = float(similarity_matrix[idx][other_idx])
                    student_info['similarity_scores'][other_idx] = similarity
            
            grouped_categories[cluster_id_str]['students'].append(student_info)
            grouped_categories[cluster_id_str]['student_count'] += 1
        
        # Calculate average similarity for each category
        for category in grouped_categories.values():
            similarities = []
            student_indices = [i for i, c in enumerate(clusters) if int(c) == int(category['category_id'])]
            for i in student_indices:
                for j in student_indices:
                    if i < j:
                        similarities.append(similarity_matrix[i][j])
            category['average_similarity'] = float(np.mean(similarities)) if similarities else 1.0
        
        # Generate insights
        insights = generate_insights(leave_letters, clusters, anomalies)
        
        # Build response
        response = {
            'success': True,
            'grouped_categories': list(grouped_categories.values()),
            'anomalies': anomalies,
            'insights': insights,
            'statistics': {
                'total_letters': len(leave_letters),
                'total_categories': len(grouped_categories),
                'total_anomalies': len(anomalies),
                'high_risk_anomalies': sum(1 for a in anomalies if a.get('risk_level') == 'high'),
                'medium_risk_anomalies': sum(1 for a in anomalies if a.get('risk_level') == 'medium'),
                'low_risk_anomalies': sum(1 for a in anomalies if a.get('risk_level') == 'low')
            }
        }
        
        return jsonify(response)
    
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
