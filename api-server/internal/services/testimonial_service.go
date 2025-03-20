package services

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type TestimonialService interface {
	ProcessTestimonials(ctx context.Context, testimonials []models.Testimonial) error
	ValidateTestimonial(t models.Testimonial) error
	FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter) ([]models.Testimonial, error)
}

type testimonialService struct {
	repo repositories.TestimonialRepository
	db   *sql.DB
}

func NewTestimonialService(repo repositories.TestimonialRepository, db *sql.DB) TestimonialService {
	return &testimonialService{repo: repo, db: db}
}

func (s *testimonialService) ProcessTestimonials(ctx context.Context, testimonials []models.Testimonial) error {
	for _, t := range testimonials {
		if err := s.ValidateTestimonial(t); err != nil {
			return err
		}
	}
	return s.repo.BatchUpsert(ctx, testimonials, s.db)
}

func (s *testimonialService) ValidateTestimonial(t models.Testimonial) error {
	return nil
}

func (s *testimonialService) FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter) ([]models.Testimonial, error) {
	return s.repo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
}
