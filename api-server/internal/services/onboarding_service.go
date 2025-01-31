package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type OnboardingService interface {
	OnboardOwner(ctx context.Context, userId uuid.UUID, workspace *models.Workspace, team_member *models.TeamMember) error
}

type onboardingService struct {
	repo repositories.Repo
	db   *sql.DB
}

func NewOnboardingService(repo repositories.Repo, db *sql.DB) OnboardingService {
	return &onboardingService{repo: repo, db: db}
}

func (s *onboardingService) OnboardOwner(ctx context.Context, userId uuid.UUID, workspace *models.Workspace, team_member *models.TeamMember) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			log.Printf("recovering from panic: %v", p)
			tx.Rollback()
		} else {
			tx.Commit()
		}
		log.Println("Finished onboarding owner")
		log.Printf("user_id: %s, workspace_id: %s, team_member_id: %s", userId, workspace.ID, team_member.ID)
		log.Println("----------------------------------------")
	}()

	// User already created during registration. Get the user
	fmt.Println("Calling GetByID")
	user, err := s.repo.User().GetByID(ctx, userId, tx)
	if err != nil {
		log.Printf("error getting user: %v", err)
		tx.Rollback()
		return err
	}
	if user == nil {
		log.Printf("user not found: %v", userId)
		tx.Rollback()
		return fmt.Errorf("user not found: %v", userId)
	}

	// Create the workspace
	fmt.Println("Calling Create on WorkspaceRepository")
	err = s.repo.Workspace().Create(ctx, workspace, tx)
	if err != nil {
		log.Printf("error creating workspace: %v", err)
		tx.Rollback()
		return err
	}

	// Create the team member
	team_member.UserID = user.ID
	team_member.WorkspaceID = workspace.ID
	team_member.Role = models.Admin
	err = s.repo.TeamMember().Create(ctx, team_member, tx)
	if err != nil {
		log.Printf("error in creating team member %v", err)
		tx.Rollback()
		return err
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		log.Printf("error committing transaction: %v", err)
		return err
	}
	return nil
}
