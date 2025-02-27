import grpc
from concurrent import futures
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel

def load_model():
    pass
    # try:
    #     # Use tiny models when possible
    #     tokenizer = AutoTokenizer.from_pretrained("prajjwal1/bert-tiny")
    #     model = AutoModel.from_pretrained("prajjwal1/bert-tiny")
        
    #     # Convert to TorchScript for optimization
    #     # Wrap in try-except as not all models support direct scripting
    #     try:
    #         model = torch.jit.script(model)
    #     except Exception as e:
    #         print(f"Warning: Could not convert to TorchScript: {e}")
            
    #     return tokenizer, model
    # except Exception as e:
    #     print(f"Error loading model: {e}")
    #     return None, None

def serve():
    print("Loading ML model...")
    # tokenizer, model = load_model()
    
    print("Starting gRPC server...")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    
    server.add_insecure_port('[::]:50052')
    server.start()
    print("GRPC server listening on port 50052...")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()