# src/services/emotions/emotion_analyzer.py
import os
import cv2
import numpy as np
import tempfile
import logging
import subprocess
from typing import Dict, Any, Optional, List, Tuple
import torch
import librosa
from PIL import Image
import time

logger = logging.getLogger(__name__)

class FaceDetector:
    """Simple face detection"""
    
    def __init__(self):
        self.detector = None
        self._init_detector()
    
    def _init_detector(self):
        """Initialize face detector"""
        try:
            cascade_file = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_file):
                self.detector = cv2.CascadeClassifier(cascade_file)
                logger.info("Face detector loaded")
        except Exception as e:
            logger.warning(f"Failed to load face detector: {e}")
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces"""
        if self.detector is None or image is None or image.size == 0:
            return []
        
        try:
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            faces = self.detector.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
            )
            
            return [(x, y, w, h) for x, y, w, h in faces if w > 40 and h > 40]
            
        except Exception as e:
            logger.warning(f"Face detection failed: {e}")
            return []

class EmotionDetector:
    """Simple emotion detection"""
    
    def __init__(self):
        self.visual_model = None
        self.audio_model = None
        self.emotion_mapping = {
            'happy': 'satisfaction', 'joy': 'satisfaction', 'content': 'satisfaction',
            'cheerful': 'satisfaction', 'excited': 'satisfaction', 'pleased': 'satisfaction',
            'proud': 'satisfaction', 'grateful': 'satisfaction', 'hopeful': 'satisfaction',
            'love': 'satisfaction', 'affection': 'satisfaction', 'elated': 'satisfaction',

            'angry': 'frustration', 'anger': 'frustration', 'annoyed': 'frustration',
            'irritated': 'frustration', 'rage': 'frustration', 'frustrated': 'frustration',
            'resentful': 'frustration', 'agitated': 'frustration', 'hostile': 'frustration',

            'sad': 'disappointment', 'sadness': 'disappointment', 'depressed': 'disappointment',
            'gloomy': 'disappointment', 'unhappy': 'disappointment', 'melancholy': 'disappointment',
            'disappointed': 'disappointment', 'lonely': 'disappointment', 'grief': 'disappointment',
            'downcast': 'disappointment', 'satisfaction': 'satisfaction',

            'fear': 'concern', 'afraid': 'concern', 'nervous': 'concern',
            'worried': 'concern', 'anxious': 'concern', 'tense': 'concern',
            'uneasy': 'concern', 'insecure': 'concern', 'apprehensive': 'concern',
            'dread': 'concern',

            'surprise': 'amazement', 'surprised': 'amazement', 'amazed': 'amazement',
            'shocked': 'amazement', 'astonished': 'amazement', 'startled': 'amazement',
            'awe': 'amazement',

            'disgust': 'skepticism', 'disgusted': 'skepticism', 'repulsed': 'skepticism',
            'contempt': 'skepticism', 'offended': 'skepticism', 'suspicious': 'skepticism',
            'distrustful': 'skepticism', 'trust': 'trust',

            'neutral': 'neutral', 'calm': 'neutral', 'indifferent': 'neutral',
            'relaxed': 'neutral', 'bored': 'neutral', 'tired': 'neutral',
        }

    
    def _load_visual_model(self):
        """Load visual model"""
        if self.visual_model is not None:
            return
        
        try:
            from transformers import pipeline
            device = 0 if torch.cuda.is_available() else -1
            
            self.visual_model = pipeline(
                "image-classification",
                model="trpakov/vit-face-expression",
                device=device,
                use_fast=True
            )
            logger.info("Visual model loaded")
        except Exception as e:
            logger.warning(f"Failed to load visual model: {e}")
    
    def _load_audio_model(self):
        """Load audio model"""
        if self.audio_model is not None:
            return
        
        try:
            from transformers import pipeline
            device = 0 if torch.cuda.is_available() else -1
            
            self.audio_model = pipeline(
                "audio-classification",
                model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition",
                device=device,
                use_fast=True
            )
            logger.info("Audio model loaded")
        except Exception as e:
            logger.warning(f"Failed to load audio model: {e}")
    
    def detect_visual_emotion(self, face_image: np.ndarray) -> Dict[str, float]:
        """Detect emotion from face"""
        self._load_visual_model()
        
        if self.visual_model is None:
            return {'neutral': 1.0}
        
        try:
            if len(face_image.shape) == 3 and face_image.shape[2] == 3:
                face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            if face_image.shape[0] > 224 or face_image.shape[1] > 224:
                face_image = cv2.resize(face_image, (224, 224))
            
            pil_image = Image.fromarray(face_image)
            results = self.visual_model(pil_image)
            
            emotions = {}
            for result in results[:2]:
                emotion = result['label'].lower()
                score = result['score']
                
                if score > 0.15:
                    business_emotion = self.emotion_mapping.get(emotion, 'neutral')
                    emotions[business_emotion] = emotions.get(business_emotion, 0) + score
            
            if emotions:
                total = sum(emotions.values())
                emotions = {k: v / total for k, v in emotions.items()}
            else:
                emotions = {'neutral': 1.0}
            
            return emotions
            
        except Exception as e:
            logger.error(f"Visual emotion detection error: {e}")
            return {'neutral': 1.0}
    
    def detect_audio_emotion(self, audio_data: np.ndarray, sample_rate: int) -> Dict[str, float]:
        """Detect emotion from audio"""
        self._load_audio_model()
        
        if self.audio_model is None:
            return {'neutral': 1.0}
        
        try:
            # Limit audio length
            max_samples = 16000 * 30  # 30 seconds max
            if len(audio_data) > max_samples:
                start = (len(audio_data) - max_samples) // 2
                audio_data = audio_data[start:start + max_samples]
            
            if sample_rate != 16000:
                audio_data = librosa.resample(audio_data, orig_sr=sample_rate, target_sr=16000)
            
            results = self.audio_model(audio_data)
            
            emotions = {}
            for result in results[:2]:
                emotion = result['label'].lower()
                score = result['score']
                
                if score > 0.15:
                    business_emotion = self.emotion_mapping.get(emotion, 'neutral')
                    emotions[business_emotion] = emotions.get(business_emotion, 0) + score
            
            if emotions:
                total = sum(emotions.values())
                emotions = {k: v / total for k, v in emotions.items()}
            else:
                emotions = {'neutral': 1.0}
            
            return emotions
            
        except Exception as e:
            logger.error(f"Audio emotion detection error: {e}")
            return {'neutral': 1.0}

class EmotionsAnalyzer:
    """Simplified emotions analyzer"""
    
    def __init__(self):
        self.max_file_size_mb = 400
        self.face_detector = FaceDetector()
        self.emotion_detector = EmotionDetector()
        self._storage_manager = None
        
        logger.info("EmotionsAnalyzer initialized")

    @property
    def storage_manager(self):
        """Lazy-loaded storage manager"""
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    def analyze(
        self,
        media_url: Optional[str] = None,
        target_emotions: Optional[List[str]] = None,
        analysis_depth: str = "comprehensive",
        media_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze emotions from media
        
        If target_emotions provided: Find segments where those emotions occur
        If no target_emotions: Find segments with strong emotions
        """
        start_time = time.time()
        file_path = None
        cleanup_file = False
        
        try:
            # Get media file
            if media_path:
                if not os.path.exists(media_path) or os.path.getsize(media_path) == 0:
                    raise ValueError(f"Invalid media file: {media_path}")
                file_path = media_path
                cleanup_file = False
            elif media_url:
                file_path = self.storage_manager.download_media(media_url)
                cleanup_file = True
            else:
                raise ValueError("Either media_url or media_path must be provided")
            
            # Detect media type
            media_type = self.storage_manager.detect_media_type(file_path)
            
            if media_type == 'unknown':
                raise ValueError(f"Unsupported media type for file: {file_path}")
            
            # Analyze based on media type
            if media_type == 'video':
                result = self._analyze_video(file_path, analysis_depth, target_emotions)
            else:
                raise ValueError(f"Unsupported media type: {media_type}")
            
            processing_time = time.time() - start_time

            from pprint import pformat
            logger.info(f"emotions analysis result: {pformat(result, indent=2)} result processed in {processing_time:.3f}")
            
            # Return format matching previous implementation + segments
            return result
            
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
            return self._create_error_result(str(e), time.time() - start_time)
        finally:
            # Clean up downloaded file
            if cleanup_file and file_path and os.path.exists(file_path):
                try:
                    os.unlink(file_path)
                except:
                    pass
    
    def _create_error_result(self, error: str, processing_time: float) -> Dict[str, Any]:
        """Create error result matching expected format"""
        return {
            'emotions': {'neutral': 1.0},
            'confidence': 0.0,
            'face_count': 0,
            'quality_score': 0.0,
            'business_insights': {'engagement': 'low', 'authenticity': 'unknown'},
            'authenticity_score': 0.0,
            'engagement_level': 0.0,
            'emotion_segments': [],
            'processing_stats': {
                'processing_time': processing_time,
                'error': error
            }
        }
    
    def _analyze_video(self, file_path: str, depth: str, target_emotions: Optional[List[str]] = None) -> Dict[str, Any]:
        """Analyze emotions from video and find segments with target emotions"""
        video_info = self.storage_manager.get_video_info(file_path)
        duration = video_info.get('duration', 0)
        
        if duration == 0:
            raise ValueError("Invalid video file or zero duration")
        
        # Determine sampling strategy based on whether we're looking for segments
        if target_emotions:
            # More samples needed to find specific emotion segments
            if depth == 'quick':
                sample_interval = 5.0  # Every 5 seconds
            elif depth == 'standard':
                sample_interval = 3.0  # Every 3 seconds
            else:  # comprehensive
                sample_interval = 2.0  # Every 2 seconds
        else:
            # Fewer samples for overall emotion analysis
            if depth == 'quick':
                sample_interval = max(10.0, duration / 3)
            elif depth == 'standard':
                sample_interval = max(8.0, duration / 4)
            else:  # comprehensive
                sample_interval = max(5.0, duration / 6)
        
        # Extract frames at regular intervals
        frame_analyses = self._analyze_video_segments(file_path, duration, sample_interval)
        
        # Find emotion segments
        emotion_segments = self._find_emotion_segments(frame_analyses, target_emotions, duration)
        
        # Calculate overall metrics
        all_emotions = [fa['emotions'] for fa in frame_analyses if fa['emotions']]
        total_faces = sum(fa['face_count'] for fa in frame_analyses)
        frames_processed = len(frame_analyses)
        
        # Add audio analysis if we found faces
        if total_faces > 0:
            audio_emotions = self._extract_and_analyze_audio(file_path, duration, depth)
            if audio_emotions:
                all_emotions.append(audio_emotions)
        
        # Combine results
        final_emotions = self._combine_emotions(all_emotions)
        confidence = self._calculate_confidence(all_emotions, total_faces, frames_processed)
        quality_score = min(1.0, total_faces / max(1, frames_processed))
        
        business_insights = self._generate_business_insights(final_emotions, confidence, total_faces)
        
        return {
            'emotions': final_emotions,
            'confidence': confidence,
            'face_count': total_faces,
            'quality_score': quality_score,
            'business_insights': business_insights,
            'authenticity_score': self._calculate_authenticity(final_emotions, total_faces > 0),
            'engagement_level': self._calculate_engagement(final_emotions),
            'emotion_segments': emotion_segments,
            'frames_processed': frames_processed,
            'audio_duration': duration
        }
    
    def _extract_video_frames(self, file_path: str, duration: float, max_samples: int) -> List[Tuple[float, np.ndarray]]:
        """Extract frames from video"""
        frames = []
        
        # Calculate timestamps
        start_offset = min(2.0, duration * 0.1)
        end_offset = min(2.0, duration * 0.1)
        usable_duration = duration - start_offset - end_offset
        
        if usable_duration <= 0:
            usable_duration = duration * 0.8
            start_offset = duration * 0.1
        
        if max_samples == 1:
            timestamps = [start_offset + usable_duration * 0.5]
        else:
            timestamps = [start_offset + usable_duration * i / (max_samples - 1) for i in range(max_samples)]
        
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return frames
        
        try:
            for timestamp in timestamps:
                cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
                ret, frame = cap.read()
                
                if ret and frame is not None and frame.size > 0:
                    # Resize if too large
                    if frame.shape[0] > 720 or frame.shape[1] > 1280:
                        scale = min(720 / frame.shape[0], 1280 / frame.shape[1])
                        new_width = int(frame.shape[1] * scale)
                        new_height = int(frame.shape[0] * scale)
                        frame = cv2.resize(frame, (new_width, new_height))
                    
                    frames.append((timestamp, frame))
                    
        finally:
            cap.release()
        
        return frames
    
    def _analyze_video_segments(self, file_path: str, duration: float, sample_interval: float) -> List[Dict[str, Any]]:
        """Analyze video at regular intervals to find emotion segments"""
        frame_analyses = []
        
        # Calculate sampling points
        current_time = 2.0  # Start 2 seconds in to avoid intro issues
        max_time = duration - 2.0  # Stop 2 seconds before end
        
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return frame_analyses
        
        try:
            while current_time < max_time:
                cap.set(cv2.CAP_PROP_POS_MSEC, current_time * 1000)
                ret, frame = cap.read()
                
                if ret and frame is not None and frame.size > 0:
                    # Resize if too large
                    if frame.shape[0] > 720 or frame.shape[1] > 1280:
                        scale = min(720 / frame.shape[0], 1280 / frame.shape[1])
                        new_width = int(frame.shape[1] * scale)
                        new_height = int(frame.shape[0] * scale)
                        frame = cv2.resize(frame, (new_width, new_height))
                    
                    # Detect faces
                    faces = self.face_detector.detect_faces(frame)
                    
                    emotions = {}
                    emotion_confidence = 0.0
                    
                    if faces:
                        # Analyze largest face
                        largest_face = max(faces, key=lambda f: f[2] * f[3])
                        x, y, w, h = largest_face
                        face_image = frame[y:y+h, x:x+w]
                        
                        if face_image.size > 0:
                            emotions = self.emotion_detector.detect_visual_emotion(face_image)
                            # Calculate confidence based on dominant emotion score
                            emotion_confidence = max(emotions.values()) if emotions else 0.0
                    
                    frame_analyses.append({
                        'timestamp': current_time,
                        'emotions': emotions,
                        'face_count': len(faces),
                        'confidence': emotion_confidence
                    })
                
                current_time += sample_interval
                
        finally:
            cap.release()
        
        return frame_analyses
    
    def _find_emotion_segments(self, frame_analyses: List[Dict[str, Any]], target_emotions: Optional[List[str]], duration: float) -> List[Dict[str, Any]]:
        """Find segments where target emotions occur or strong emotions if no targets"""
        segments = []
        
        if not frame_analyses:
            return segments
        
        # Define what we're looking for
        if target_emotions:
            # Look for specific target emotions
            search_emotions = target_emotions
            min_score_threshold = 0.3  # Lower threshold for target emotions
        else:
            # Look for any strong emotions (non-neutral)
            search_emotions = ['satisfaction', 'enthusiasm', 'confidence', 'frustration', 'disappointment', 'concern', 'amazement', 'skepticism']
            min_score_threshold = 0.4  # Higher threshold for strong emotions
        
        # Find frames with target/strong emotions
        emotion_frames = []
        for frame_data in frame_analyses:
            emotions = frame_data['emotions']
            timestamp = frame_data['timestamp']
            confidence = frame_data['confidence']
            
            if not emotions:
                continue
            
            # Check if any target emotion is strong enough
            for emotion in search_emotions:
                score = emotions.get(emotion, 0.0)
                if score >= min_score_threshold and confidence >= 0.3:
                    emotion_frames.append({
                        'timestamp': timestamp,
                        'emotion': emotion,
                        'score': score,
                        'confidence': confidence,
                        'all_emotions': emotions
                    })
                    break  # Only add each frame once
        
        # Group nearby frames into segments
        if emotion_frames:
            segments = self._group_frames_into_segments(emotion_frames, duration)
        
        return segments
    
    def _group_frames_into_segments(self, emotion_frames: List[Dict[str, Any]], duration: float) -> List[Dict[str, Any]]:
        """Group nearby emotion frames into continuous segments"""
        if not emotion_frames:
            return []
        
        segments = []
        current_segment = None
        segment_gap_threshold = 8.0  # Seconds - if frames are more than 8s apart, start new segment
        min_segment_duration = 3.0   # Minimum segment length
        max_segment_duration = 30.0  # Maximum segment length
        
        # Sort frames by timestamp
        emotion_frames.sort(key=lambda x: x['timestamp'])
        
        for frame in emotion_frames:
            timestamp = frame['timestamp']
            
            if current_segment is None:
                # Start new segment
                current_segment = {
                    'start_time': timestamp,
                    'end_time': timestamp,
                    'dominant_emotion': frame['emotion'],
                    'average_score': frame['score'],
                    'average_confidence': frame['confidence'],
                    'frame_count': 1,
                    'emotions': [frame['all_emotions']]
                }
            else:
                # Check if this frame should be part of current segment
                time_gap = timestamp - current_segment['end_time']
                
                if time_gap <= segment_gap_threshold:
                    # Extend current segment
                    current_segment['end_time'] = timestamp
                    current_segment['frame_count'] += 1
                    current_segment['emotions'].append(frame['all_emotions'])
                    
                    # Update averages
                    current_segment['average_score'] = (current_segment['average_score'] + frame['score']) / 2
                    current_segment['average_confidence'] = (current_segment['average_confidence'] + frame['confidence']) / 2
                    
                    # Update dominant emotion if this one is stronger
                    if frame['score'] > current_segment['average_score']:
                        current_segment['dominant_emotion'] = frame['emotion']
                else:
                    # Gap too large, finish current segment and start new one
                    self._finalize_segment(current_segment, segments, min_segment_duration, max_segment_duration, duration)
                    
                    # Start new segment
                    current_segment = {
                        'start_time': timestamp,
                        'end_time': timestamp,
                        'dominant_emotion': frame['emotion'],
                        'average_score': frame['score'],
                        'average_confidence': frame['confidence'],
                        'frame_count': 1,
                        'emotions': [frame['all_emotions']]
                    }
        
        # Don't forget the last segment
        if current_segment:
            self._finalize_segment(current_segment, segments, min_segment_duration, max_segment_duration, duration)
        
        return segments
    
    def _finalize_segment(self, segment: Dict[str, Any], segments: List[Dict[str, Any]], 
                         min_segment_duration: float, max_segment_duration: float, video_duration: float):
        """Finalize and add segment if it meets criteria"""
        segment_duration = segment['end_time'] - segment['start_time']
        
        # Extend short segments
        if segment_duration < min_segment_duration:
            extend_time = (min_segment_duration - segment_duration) / 2
            segment['start_time'] = max(0, segment['start_time'] - extend_time)
            segment['end_time'] = min(video_duration, segment['end_time'] + extend_time)
            segment_duration = segment['end_time'] - segment['start_time']
        
        # Truncate long segments
        if segment_duration > max_segment_duration:
            # Keep the middle portion
            middle_time = (segment['start_time'] + segment['end_time']) / 2
            segment['start_time'] = middle_time - max_segment_duration / 2
            segment['end_time'] = middle_time + max_segment_duration / 2
            segment_duration = max_segment_duration
        
        # Calculate final segment emotions
        combined_emotions = self._combine_emotions(segment['emotions'])
        
        # Add final segment
        segments.append({
            'start_time': round(segment['start_time'], 1),
            'end_time': round(segment['end_time'], 1),
            'duration': round(segment_duration, 1),
            'dominant_emotion': segment['dominant_emotion'],
            'emotions': combined_emotions,
            'confidence': round(segment['average_confidence'], 3),
            'strength': round(segment['average_score'], 3),
            'frame_count': segment['frame_count']
        })
       
    
    def _extract_and_analyze_audio(self, file_path: str, duration: float, depth: str) -> Optional[Dict[str, float]]:
        """Extract and analyze audio from video"""
        try:
            temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_audio.close()
            
            max_duration = {'quick': 10, 'standard': 20, 'comprehensive': 30}[depth]
            extract_duration = min(duration, max_duration)
            start_time = max(0, (duration - extract_duration) / 2)
            
            cmd = [
                'ffmpeg', '-i', file_path, '-ss', str(start_time), 
                '-t', str(extract_duration), '-ar', '16000', 
                '-ac', '1', '-y', temp_audio.name
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return None
            
            audio_data, sample_rate = librosa.load(temp_audio.name, sr=16000)
            emotions = self.emotion_detector.detect_audio_emotion(audio_data, sample_rate)
            
            os.unlink(temp_audio.name)
            
            return emotions
            
        except Exception as e:
            logger.warning(f"Audio extraction failed: {e}")
            return None
    
    def _combine_emotions(self, emotion_list: List[Dict[str, float]]) -> Dict[str, float]:
        """Combine multiple emotion analyses"""
        if not emotion_list:
            return {'neutral': 1.0}
        
        combined = {}
        
        for emotions in emotion_list:
            for emotion, score in emotions.items():
                combined[emotion] = combined.get(emotion, 0) + score
        
        total = sum(combined.values())
        if total > 0:
            combined = {k: v / total for k, v in combined.items()}
        else:
            combined = {'neutral': 1.0}
        
        return dict(sorted(combined.items(), key=lambda x: x[1], reverse=True))
    
    def _calculate_confidence(self, emotion_list: List[Dict[str, float]], faces_detected: int, frames_processed: int) -> float:
        """Calculate overall confidence"""
        if not emotion_list:
            return 0.0
        
        sample_confidence = min(0.6, len(emotion_list) * 0.2)
        face_confidence = min(0.7, faces_detected * 0.15) if faces_detected > 0 else 0.1
        frame_confidence = min(0.5, frames_processed * 0.1) if frames_processed > 0 else 0.0
        
        final_confidence = (sample_confidence + face_confidence + frame_confidence) / 3
        
        return min(0.85, max(0.1, final_confidence))
    
    def _generate_business_insights(self, emotions: Dict[str, float], confidence: float, faces_detected: int) -> Dict[str, str]:
        """Generate business insights"""
        insights = {}
        
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'neutral'
        dominant_score = emotions.get(dominant_emotion, 0.0)
        
        # Engagement
        positive_emotions = ['satisfaction', 'enthusiasm', 'confidence', 'amazement']
        positive_score = sum(emotions.get(e, 0.0) for e in positive_emotions)
        
        if positive_score > 0.5:
            insights['engagement'] = 'high'
        elif positive_score > 0.25:
            insights['engagement'] = 'medium'
        else:
            insights['engagement'] = 'low'
        
        # Authenticity
        if faces_detected > 0 and confidence > 0.4:
            if dominant_emotion in positive_emotions and dominant_score > 0.3:
                insights['authenticity'] = 'high'
            elif dominant_emotion == 'neutral' and dominant_score < 0.8:
                insights['authenticity'] = 'medium'
            else:
                insights['authenticity'] = 'low'
        else:
            insights['authenticity'] = 'unknown'
        
        # Sentiment
        negative_emotions = ['frustration', 'disappointment', 'concern', 'skepticism']
        negative_score = sum(emotions.get(e, 0.0) for e in negative_emotions)
        
        if positive_score > negative_score + 0.15:
            insights['sentiment'] = 'positive'
        elif negative_score > positive_score + 0.15:
            insights['sentiment'] = 'negative'
        else:
            insights['sentiment'] = 'neutral'
        
        return insights
    
    def _calculate_authenticity(self, emotions: Dict[str, float], has_faces: bool) -> float:
        """Calculate authenticity score"""
        if not has_faces:
            return 0.0
        
        emotion_count = sum(1 for score in emotions.values() if score > 0.1)
        diversity_score = min(0.7, emotion_count * 0.2)
        
        max_emotion_score = max(emotions.values()) if emotions else 1.0
        distribution_score = 1.0 - min(0.3, max(0.0, max_emotion_score - 0.7))
        
        return (diversity_score + distribution_score) / 2
    
    def _calculate_engagement(self, emotions: Dict[str, float]) -> float:
        """Calculate engagement level"""
        positive_emotions = ['satisfaction', 'enthusiasm', 'confidence', 'amazement']
        positive_score = sum(emotions.get(e, 0.0) for e in positive_emotions)
        
        strong_emotions = ['enthusiasm', 'frustration', 'amazement']
        strong_score = sum(emotions.get(e, 0.0) for e in strong_emotions)
        
        neutral_score = emotions.get('neutral', 0.0)
        
        engagement = positive_score * 0.7 + strong_score * 0.3 - neutral_score * 0.4
        
        return max(0.0, min(1.0, engagement))
    
    def _calculate_audio_quality(self, audio_data: np.ndarray, sample_rate: int) -> float:
        """Calculate audio quality score"""
        try:
            rms = np.sqrt(np.mean(audio_data ** 2))
            zcr = librosa.feature.zero_crossing_rate(audio_data)[0]
            zcr_mean = np.mean(zcr)
            
            quality = min(1.0, rms * 4 + (0.25 - min(0.25, zcr_mean)) * 3)
            
            return max(0.2, min(1.0, quality))
            
        except Exception:
            return 0.5