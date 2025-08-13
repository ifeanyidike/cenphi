package queue

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"
)

type Service interface {
	Publish(ctx context.Context, name string, message Message) (string, error)
	PublishScheduled(ctx context.Context, queueName string, message Message, scheduledAt time.Time) (string, error)
	Consume(ctx context.Context, name string, handler func(context.Context, Message) error) error
	SetJobStatus(ctx context.Context, jobID, status string, progress int, result any, opts ...JobStatusOption)
	GetJobStatus(ctx context.Context, jobID string) (JobResult, error)
	GetKeys(ctx context.Context, pattern string) ([]string, error)
	CancelJob(ctx context.Context, jobID string) error
	StopConsumer(queueName string)
	HealthCheck() error
	Close()
}

type Worker interface {
	Start() error
	Stop()
	Name() string
}

func StartAll(workers []Worker, logger *zap.Logger) {
	var wg sync.WaitGroup

	for _, worker := range workers {
		wg.Add(1)

		go func(w Worker) {
			defer wg.Done()

			logger.Info("Starting worker", zap.String("name", w.Name()))

			// Don't use Fatal here - instead, log error and continue
			if err := w.Start(); err != nil {
				logger.Error("Failed to start worker",
					zap.String("name", w.Name()),
					zap.Error(err))
			} else {
				logger.Info("Worker started successfully",
					zap.String("name", w.Name()))
			}
		}(worker)

		// Small delay between starting workers
		time.Sleep(100 * time.Millisecond)
	}

	// Wait for all workers to attempt startup
	wg.Wait()
	logger.Info("All workers startup attempts completed")
}

func StopAll(workers []Worker, logger *zap.Logger) {
	var wg sync.WaitGroup

	for _, worker := range workers {
		if worker == nil {
			continue
		}

		wg.Add(1)
		go func(w Worker) {
			defer wg.Done()

			logger.Info("Stopping worker", zap.String("name", w.Name()))
			w.Stop()
			logger.Info("Worker stopped", zap.String("name", w.Name()))
		}(worker)
	}

	// Wait for all workers to stop with a timeout
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Info("All workers stopped successfully")
	case <-time.After(30 * time.Second):
		logger.Warn("Timeout waiting for workers to stop")
	}
}
