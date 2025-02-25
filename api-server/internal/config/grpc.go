package config

import (
	"fmt"

	"github.com/ifeanyidike/cenphi/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Intelligence interface {
	ConnectToService() (*grpc.ClientConn, error)
	GetClient() *pb.IntelligenceClient
}

type Inteligencer struct {
	Client *pb.IntelligenceClient
}

func NewIntelligence() Intelligence {
	return &Inteligencer{}
}

var GrpcClient *pb.IntelligenceClient

func (i *Inteligencer) ConnectToService() (*grpc.ClientConn, error) {
	//creds := credentials.NewClientTLSFromCert(nil, "cenphiaiservice.duckdns.org")
	conn, err := grpc.NewClient("ai-service:50052", grpc.WithTransportCredentials(insecure.NewCredentials()))

	if err != nil {
		return conn, fmt.Errorf("failed to connect to intelligence service: %v", err)
	}

	client := pb.NewIntelligenceClient(conn)
	fmt.Println("connecting to intelligence service ")

	GrpcClient = &client
	i.Client = &client

	return conn, nil
}

func (i *Inteligencer) GetClient() *pb.IntelligenceClient {
	return i.Client
}
