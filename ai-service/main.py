import grpc
from concurrent import futures


def serve():
    print("GRPC server listening...")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    server.add_insecure_port('[::]:50052')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
