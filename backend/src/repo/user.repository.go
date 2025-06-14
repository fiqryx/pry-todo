package repo

import (
	"fmt"
	"time"
	"webservices/src/model"
	"webservices/src/types"
	t "webservices/src/types"

	"gorm.io/gorm"
)

type UserRepository struct {
	*baseRepository
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *UserRepository) GetByID(ID string) (*model.User, error) {
	var user model.User

	if err := r.db.First(&user, "id = ?", ID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) GetDetail(ID string) (*model.User, error) {
	var user model.User

	if err := r.db.
		Preload("Project", func(db *gorm.DB) *gorm.DB {
			return db.Joins("Setting").Preload("Users")
		}).
		First(&user, "id = ?", ID).Error; err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	var userProjects []model.UserProject
	if err := r.db.Find(&userProjects, "project_id = ?",
		user.ProjectID).Error; err != nil {
		return nil, fmt.Errorf("failed to find projects: %w", err)
	}

	roles := make(map[string]types.UserProjectRole)
	for _, up := range userProjects {
		roles[up.UserID] = up.Role
		if user.ID == up.UserID {
			user.Role = up.Role
		}
	}

	if user.Project != nil {
		for i, v := range user.Project.Users {
			if role, exists := roles[v.ID]; exists {
				user.Project.Users[i].Role = role
			}
		}
	}

	return &user, nil
}

func (r *UserRepository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, "email = ?",
		email).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) Create(user *model.User) error {
	if err := r.db.Create(user).Error; err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *UserRepository) Update(user *model.User) error {
	if err := r.db.Updates(user).Error; err != nil {
		return fmt.Errorf("failed to updates user: %w", err)
	}
	return nil
}

func (r *UserRepository) Heartbeat(ID string) error {
	if ID == "" {
		return fmt.Errorf("heartbeat failed empty ID")
	}

	result := r.db.
		Select("updated_at").
		Table("users").
		Where("id = ?", ID).
		Update("updated_at", time.Now())

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no user found with ID %s", ID)
	}

	return nil
}

func (r *UserRepository) ValidatePermission(userID, projectID string, level t.UserProjectRole) error {
	if userID == "" || projectID == "" {
		return fmt.Errorf("permission denied: parameter is empty")
	}

	var userProject model.UserProject
	if err := r.db.First(&userProject, "user_id = ? AND project_id = ?",
		userID, projectID).Error; err != nil {
		return fmt.Errorf("permission denied: project not found %w", err)
	}

	levels := types.LevelUserProjectRole

	userLevel, ok := levels[userProject.Role]
	if !ok {
		return fmt.Errorf("invalid user role")
	}

	requiredLevel, ok := levels[level]
	if !ok {
		return fmt.Errorf("invalid required role")
	}

	if userLevel < requiredLevel {
		return fmt.Errorf("permission denied: user role is insufficient")
	}

	return nil
}

func (r *UserRepository) SwitchProject(userID, projectID string) error {
	return r.SwitchProjectTx(r.db, userID, projectID)
}

func (r *UserRepository) SwitchProjectTx(tx *gorm.DB, userID, projectID string) error {
	if userID == "" || projectID == "" {
		return fmt.Errorf("failed to switch project: parameter is empty")
	}

	if err := tx.
		Select("project_id").
		Table("users").
		Where("id = ?", userID).
		Update("project_id", projectID).
		Error; err != nil {
		return fmt.Errorf("failed to switch project: %w", err)
	}

	return nil
}
