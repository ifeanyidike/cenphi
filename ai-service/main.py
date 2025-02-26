import grpc
from concurrent import futures
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel

def load_model():
    pass
   

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