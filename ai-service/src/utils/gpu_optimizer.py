# src/utils/gpu_optimizer.py

import os
import logging
from typing import Optional, Any, List
import torch
import gc

logger = logging.getLogger(__name__)


class GPUOptimizer:
    """
    🚀 Universal GPU Optimization Utility
    Handles CUDA (production) and MPS (local testing) optimizations
    """
    
    def __init__(self, service_name: str = "AI"):
        self.service_name = service_name
        self.device = None
        self.gpu_memory_gb = 0
        self.is_ampere_plus = False
        self.mixed_precision = False
        self.optimal_batch_size = 1
        
        self._initialize_device()
        self._apply_optimizations()
        self._calculate_optimal_settings()
    
    def _initialize_device(self) -> None:
        """Initialize and detect the best available device"""
        if torch.cuda.is_available():
            logger.info(f"🚀 {self.service_name}: Using CUDA GPU for AI processing")
            self.device = torch.device('cuda')
            
            # Get GPU info for optimization decisions
            gpu_props = torch.cuda.get_device_properties(0)
            self.gpu_memory_gb = gpu_props.total_memory / (1024**3)
            self.is_ampere_plus = gpu_props.major >= 8  # A100, RTX 30/40 series
            self.mixed_precision = True
            
            logger.info(f"   GPU: {torch.cuda.get_device_name(0)} ({self.gpu_memory_gb:.1f}GB)")
            if self.is_ampere_plus:
                logger.info("   ⚡ Ampere+ GPU detected - Tensor Cores enabled")
                
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available() and torch.backends.mps.is_built():
            logger.info(f"🚀 {self.service_name}: Using Apple MPS GPU for AI processing")
            self.device = torch.device('mps')
            self.gpu_memory_gb = 16  # Estimate for Mac M3
            self.is_ampere_plus = False
            self.mixed_precision = False  # MPS doesn't support autocast yet
            
        else:
            logger.info(f"🚀 {self.service_name}: Using CPU for AI processing")
            self.device = torch.device('cpu')
            self.gpu_memory_gb = 0
            self.is_ampere_plus = False
            self.mixed_precision = False
    
    def _apply_optimizations(self) -> None:
        """Apply device-specific optimizations"""
        if self.device.type == 'cuda':
            # CUDA-specific optimizations for production
            torch.backends.cudnn.benchmark = True
            torch.backends.cudnn.deterministic = False
            torch.backends.cuda.matmul.allow_tf32 = True  # Faster matmul on Ampere+
            torch.backends.cudnn.allow_tf32 = True
            os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512,expandable_segments:True'
            torch.cuda.empty_cache()
            logger.info("   ⚡ CUDA optimizations applied")
            
        elif self.device.type == 'mps':
            # MPS-specific optimizations
            os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
            torch.mps.empty_cache()
            logger.info("   ⚡ MPS optimizations applied")
    
    def _calculate_optimal_settings(self) -> None:
        """Calculate optimal batch size and other settings based on GPU"""
        if self.device.type == 'cuda':
            if self.gpu_memory_gb >= 24:  # RTX 4090, A100, etc.
                self.optimal_batch_size = 8
            elif self.gpu_memory_gb >= 16:  # RTX 4080, A6000, etc.
                self.optimal_batch_size = 6
            elif self.gpu_memory_gb >= 12:  # RTX 4070 Ti, RTX 3080 Ti
                self.optimal_batch_size = 4
            elif self.gpu_memory_gb >= 8:   # RTX 4060 Ti, RTX 3070
                self.optimal_batch_size = 2
            else:
                self.optimal_batch_size = 1
        elif self.device.type == 'mps':
            self.optimal_batch_size = 2  # Conservative for MPS
        else:
            self.optimal_batch_size = 1  # CPU
            
        logger.info(f"   📊 Optimal batch size: {self.optimal_batch_size}")
    
    def optimize_model(self, model: torch.nn.Module) -> torch.nn.Module:
        """Apply device-specific optimizations to model"""
        model = model.to(self.device)
        
        if self.device.type == 'cuda':
            try:
                # FIRST script the model, THEN optimize
                model = torch.jit.script(model)
                model = torch.jit.optimize_for_inference(model)
            except Exception as e:
                logger.warning(f"Model scripting failed, using regular model: {e}")
                # Fall back to regular model without JIT optimization

            if self.is_ampere_plus:
                # Use FP16 for massive speedup on Tensor Cores
                try:
                    model = model.half()
                except Exception as e:
                    logger.warning(f"Half precision failed: {e}")

            
            # Enable CUDA graph for repeated inference (huge speedup)
            if hasattr(torch.cuda, 'CUDAGraph'):
                try:
                    model = torch.jit.script(model)
                except Exception:
                    pass  # Some models can't be scripted
                    
        elif self.device.type == 'mps':
            # MPS optimizations - keep FP32 for stability
            pass
        
        model.eval()
        logger.info(f"   🧠 Model optimized for {self.device.type.upper()}")
        return model
    
    def get_optimal_chunk_size(self, base_size: int = 512) -> int:
        """Get optimal chunk size based on GPU memory"""
        if self.device.type == 'cuda':
            if self.gpu_memory_gb >= 16:
                return min(1024, base_size * 2)  # Large chunks for high-memory GPUs
            elif self.gpu_memory_gb >= 8:
                return min(768, int(base_size * 1.5))
            else:
                return base_size
        elif self.device.type == 'mps':
            return min(384, base_size)  # Conservative for MPS
        else:
            return min(256, base_size)  # Very conservative for CPU
    
    # def prepare_tensor(self, tensor: torch.Tensor) -> torch.Tensor:
    #     """Prepare tensor with optimal settings for device"""
    #     if self.device.type == 'cuda':
    #         # Use pinned memory for faster GPU transfer
    #         return tensor.pin_memory().to(self.device, non_blocking=True)
    #     else:
    #         return tensor.to(self.device)

    def prepare_tensor(self, tensor: torch.Tensor) -> torch.Tensor:
        """Prepare tensor with optimal settings for device"""
        if self.device.type == 'cuda':
            # Use pinned memory for faster GPU transfer
            if not tensor.is_pinned():
                tensor = tensor.pin_memory()
            return tensor.to(self.device, non_blocking=True)
        else:
            return tensor.to(self.device)
    
    def inference_context(self):
        """Context manager for optimal inference"""
        if self.device.type == 'cuda' and self.mixed_precision and self.is_ampere_plus:
            return torch.cuda.amp.autocast()
        else:
            return torch.no_grad()
    
    def clear_cache(self, force: bool = False) -> None:
        """Smart GPU memory cache clearing"""
        if self.device.type == 'cuda':
            # Only clear when memory usage is high
            if force:
                torch.cuda.empty_cache()
                gc.collect()
            else:
                memory_used = torch.cuda.memory_allocated() / torch.cuda.max_memory_allocated()
                if memory_used > 0.7:  # 70% threshold
                    torch.cuda.empty_cache()
                    gc.collect()
        elif self.device.type == 'mps':
            # MPS doesn't have memory_allocated(), so always clear (conservative)
            torch.mps.empty_cache()
            gc.collect()
        else:
            # CPU - just garbage collect
            gc.collect()
    
    def process_batch(self, model: torch.nn.Module, batch_tensor: torch.Tensor) -> torch.Tensor:
        """Process batch with optimal settings"""
        with torch.no_grad():
            if self.device.type == 'cuda' and self.is_ampere_plus and self.mixed_precision:
                with torch.cuda.amp.autocast():
                    return model(batch_tensor)
            else:
                return model(batch_tensor)
    
    def should_use_batching(self, num_items: int) -> bool:
        """Determine if batching should be used"""
        return (num_items > 1 and 
                self.device.type in ['cuda', 'mps'] and 
                self.optimal_batch_size > 1)
    
    def get_processing_stats(self) -> dict:
        """Get processing statistics and capabilities"""
        return {
            "device": str(self.device),
            "device_type": self.device.type,
            "gpu_memory_gb": self.gpu_memory_gb,
            "is_ampere_plus": self.is_ampere_plus,
            "mixed_precision": self.mixed_precision,
            "optimal_batch_size": self.optimal_batch_size,
            "cuda_available": torch.cuda.is_available(),
            "mps_available": hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
        }


class GPUBatchProcessor:
    """
    🚀 GPU Batch Processing Utility
    Handles efficient batch processing for various AI tasks
    """
    
    def __init__(self, gpu_optimizer: GPUOptimizer):
        self.gpu_optimizer = gpu_optimizer
        self.device = gpu_optimizer.device
        self.batch_size = gpu_optimizer.optimal_batch_size
    
    def process_frames_batch(self, model: torch.nn.Module, frame_paths: List[str], 
                           output_dir: str, preprocess_fn=None, postprocess_fn=None) -> bool:
        """Process multiple frames in batches for maximum GPU efficiency"""
        try:
            import cv2
            import numpy as np
            
            total_frames = len(frame_paths)
            logger.info(f"🚀 Batch processing {total_frames} frames (batch_size={self.batch_size})")
            
            for batch_start in range(0, total_frames, self.batch_size):
                batch_end = min(batch_start + self.batch_size, total_frames)
                batch_paths = frame_paths[batch_start:batch_end]
                
                # Load batch
                batch_inputs = []
                valid_paths = []
                
                for frame_path in batch_paths:
                    img = cv2.imread(frame_path)
                    if img is not None:
                        if preprocess_fn:
                            img_tensor = preprocess_fn(img)
                        else:
                            # Default preprocessing
                            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                            img_tensor = torch.from_numpy(img_rgb.astype(np.float32) / 255.0).permute(2, 0, 1)
                        
                        batch_inputs.append(img_tensor)
                        valid_paths.append(frame_path)
                
                if not batch_inputs:
                    continue
                
                # Process batch
                if len(batch_inputs) > 1 and self.gpu_optimizer.should_use_batching(len(batch_inputs)):
                    # True batch processing
                    # batch_tensor = torch.stack(batch_inputs)
                    # batch_tensor = self.gpu_optimizer.prepare_tensor(batch_tensor)
                    
                    # batch_output = self.gpu_optimizer.process_batch(model, batch_tensor)
                    batch_tensor = torch.stack(batch_inputs).to(self.device, non_blocking=True)

                    batch_output = self.gpu_optimizer.process_batch(model, batch_tensor)
                    
                    # Save batch results
                    for i, frame_path in enumerate(valid_paths):
                        output_path = os.path.join(output_dir, os.path.basename(frame_path))
                        frame_output = batch_output[i]
                        
                        if postprocess_fn:
                            success = postprocess_fn(frame_output, output_path)
                        else:
                            # Default postprocessing
                            denoised = torch.clamp(frame_output, 0, 1)
                            denoised_np = denoised.permute(1, 2, 0).cpu().numpy()
                            denoised_np = (denoised_np * 255).astype(np.uint8)
                            denoised_bgr = cv2.cvtColor(denoised_np, cv2.COLOR_RGB2BGR)
                            success = cv2.imwrite(output_path, denoised_bgr, [cv2.IMWRITE_PNG_COMPRESSION, 1])
                else:
                    # Individual processing
                    # for i, frame_path in enumerate(valid_paths):
                    #     input_tensor = batch_inputs[i].unsqueeze(0)
                    #     input_tensor = self.gpu_optimizer.prepare_tensor(input_tensor)
                        
                    #     with torch.no_grad():
                    #         output_tensor = model(input_tensor)
                        
                    #     output_path = os.path.join(output_dir, os.path.basename(frame_path))
                        
                    #     if postprocess_fn:
                    #         postprocess_fn(output_tensor.squeeze(0), output_path)
                    #     else:
                    #         # Default postprocessing
                    #         denoised = torch.clamp(output_tensor.squeeze(0), 0, 1)
                    #         denoised_np = denoised.permute(1, 2, 0).cpu().numpy()
                    #         denoised_np = (denoised_np * 255).astype(np.uint8)
                    #         denoised_bgr = cv2.cvtColor(denoised_np, cv2.COLOR_RGB2BGR)
                    #         cv2.imwrite(output_path, denoised_bgr, [cv2.IMWRITE_PNG_COMPRESSION, 1])

                    with torch.no_grad():
                        for i, frame_path in enumerate(valid_paths):
                            input_tensor = batch_inputs[i].unsqueeze(0).to(self.device, non_blocking=True)
                            output_tensor = model(input_tensor)
                        
                        output_path = os.path.join(output_dir, os.path.basename(frame_path))
                        
                        if postprocess_fn:
                            postprocess_fn(output_tensor.squeeze(0), output_path)
                        else:
                            # Default postprocessing
                            denoised = torch.clamp(output_tensor.squeeze(0), 0, 1)
                            denoised_np = denoised.permute(1, 2, 0).cpu().numpy()
                            denoised_np = (denoised_np * 255).astype(np.uint8)
                            denoised_bgr = cv2.cvtColor(denoised_np, cv2.COLOR_RGB2BGR)
                            cv2.imwrite(output_path, denoised_bgr, [cv2.IMWRITE_PNG_COMPRESSION, 1])
                
                # Progress and memory management
                # if (batch_start // self.batch_size + 1) % 10 == 0:
                #     processed = min(batch_end, total_frames)
                #     logger.info(f"   📊 Processed {processed}/{total_frames} frames")
                #     self.gpu_optimizer.clear_cache()

                cleanup_frequency = 5 if self.gpu_optimizer.gpu_memory_gb < 12 else 15
                if (batch_start // self.batch_size + 1) % cleanup_frequency == 0:
                    processed = min(batch_end, total_frames)
                    logger.info(f"   📊 Processed {processed}/{total_frames} frames")
                    self.gpu_optimizer.clear_cache()
            
            logger.info(f"✅ Batch processing completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Batch processing failed: {e}")
            return False