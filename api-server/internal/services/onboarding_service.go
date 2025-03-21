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
	OnboardOwner(ctx context.Context, uid string, workspace *models.Workspace, team_member *models.TeamMember) error
	// OnboardOwnerFull(ctx context.Context, userId uuid.UUID, workspace *models.Workspace, team_member *models.TeamMember) error
}

type onboardingService struct {
	repo repositories.Repo
	db   *sql.DB
}

type WorkspaceOpFunc func(ctx context.Context, entity *models.Workspace, db repositories.DB) error
type TeamMemberOpFunc func(ctx context.Context, entity *models.TeamMember, db repositories.DB) error

func NewOnboardingService(repo repositories.Repo, db *sql.DB) OnboardingService {
	return &onboardingService{repo: repo, db: db}
}

// func (s *onboardingService) handleOnboardingFlow(
// 	ctx context.Context,
// 	userId uuid.UUID,
// 	workspace *models.Workspace,
// 	team_member *models.TeamMember,
// 	workspaceOp WorkspaceOpFunc,
// 	teamMemberOp TeamMemberOpFunc,
// ) error {
// 	tx, err := s.db.BeginTx(ctx, nil)
// 	if err != nil {
// 		return err
// 	}

// 	defer func() {
// 		if p := recover(); p != nil {
// 			log.Printf("recovering from panic: %v", p)
// 			tx.Rollback()
// 		} else {
// 			tx.Commit()
// 		}
// 	}()

// 	// User already created during registration. Get the user

// 	user, err := s.repo.User().GetByID(ctx, userId, tx)
// 	if err != nil {
// 		log.Printf("error getting user: %v", err)
// 		tx.Rollback()
// 		return err
// 	}
// 	if user == nil {
// 		log.Printf("user not found: %v", userId)
// 		tx.Rollback()
// 		return fmt.Errorf("user not found: %v", userId)
// 	}

// 	// Create the workspace
// 	err = workspaceOp(ctx, workspace, tx)
// 	if err != nil {
// 		log.Printf("error creating workspace: %v", err)
// 		tx.Rollback()
// 		return err
// 	}

// 	// Create the team member
// 	team_member.UserID = user.ID
// 	team_member.WorkspaceID = workspace.ID
// 	team_member.Role = models.Admin
// 	err = teamMemberOp(ctx, team_member, tx)
// 	// s.repo.TeamMember().Create

// 	if err != nil {
// 		log.Printf("error in creating team member %v", err)
// 		tx.Rollback()
// 		return err
// 	}

// 	// Commit the transaction
// 	if err := tx.Commit(); err != nil {
// 		log.Printf("error committing transaction: %v", err)
// 		return err
// 	}
// 	return nil

// }

func (s *onboardingService) OnboardOwner(ctx context.Context, uid string, workspace *models.Workspace, team_member *models.TeamMember) error {
	if workspace == nil {
		fmt.Println("workspace is nil")
		return fmt.Errorf("workspace cannot be nil")
	}
	if team_member == nil {
		fmt.Println("team member is nil")
		return fmt.Errorf("team_member cannot be nil")
	}

	if team_member.Role == "" {
		fmt.Println("role is not defined")
		team_member.Role = models.Admin
	}

	// Ensure IDs are initialized
	if workspace.ID == uuid.Nil {
		workspace.ID = uuid.New()
	}
	if team_member.ID == uuid.Nil {
		team_member.ID = uuid.New()
	}

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
	}()

	// User already created during registration. Get the user

	user, err := s.repo.User().FindByUID(ctx, uid, tx)
	if err != nil {
		log.Printf("error getting user: %v", err)
		tx.Rollback()
		return err
	}

	if user == nil {
		log.Printf("user not found: %v", uid)
		tx.Rollback()
		return fmt.Errorf("user not found: %v", uid)
	}

	existing_member, err := s.repo.TeamMember().GetDataByUserID(ctx, user.ID, tx)

	if existing_member != nil || err == nil {
		log.Printf("team member already exists: %v", err)
		tx.Rollback()
		return fmt.Errorf("team member already exists: %v", err)
	}

	// Create the workspace
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
	// if err := tx.Commit(); err != nil {
	// 	log.Printf("error committing transaction: %v", err)
	// 	return err
	// }
	return nil
}

// func (s *onboardingService) OnboardOwner(ctx context.Context, userId uuid.UUID, workspace *models.Workspace, team_member *models.TeamMember) error {
// 	return s.handleOnboardingFlow(
// 		ctx,
// 		userId,
// 		workspace,
// 		team_member,
// 		s.repo.Workspace().Create,
// 		s.repo.TeamMember().Create,
// 	)
// }

// func (s *onboardingService) OnboardOwnerFull(ctx context.Context, userId uuid.UUID, workspace *models.Workspace, team_member *models.TeamMember) error {
// 	updateWorkspace := func(ctx context.Context, workspace *models.Workspace, db repositories.DB) error {
// 		return s.repo.Workspace().Update(ctx, workspace, workspace.ID, db)
// 	}

// 	updateTeamMember := func(ctx context.Context, team_member *models.TeamMember, db repositories.DB) error {
// 		return s.repo.TeamMember().Update(ctx, team_member, team_member.ID, db)
// 	}

// 	return s.handleOnboardingFlow(
// 		ctx,
// 		userId,
// 		workspace,
// 		team_member,
// 		updateWorkspace,
// 		updateTeamMember,
// 	)
// }
