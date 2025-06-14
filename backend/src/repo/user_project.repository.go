package repo

import (
	"fmt"
	"webservices/src/model"

	"gorm.io/gorm"
)

type UserProjectRepository struct {
	*baseRepository
}

func NewUserProjectRepository(db *gorm.DB) *UserProjectRepository {
	return &UserProjectRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *UserProjectRepository) Get(projectID, userID string) (*model.UserProject, error) {
	var userProject model.UserProject

	if err := r.db.Model(&userProject).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		First(&userProject).Error; err != nil {
		return nil, fmt.Errorf("failed to get user project: %w", err)
	}

	return &userProject, nil
}

func (r *UserProjectRepository) Check(projectID, userID string) error {
	var count int64
	if err := r.db.Model(&model.UserProject{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check user project: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("you are already a member of this project")
	}

	return nil
}

func (r *UserProjectRepository) Create(userProject *model.UserProject) error {
	return r.db.Create(userProject).Error
}

func (r *UserProjectRepository) GetUserIDs(projectID string) ([]string, error) {
	var ids []string

	if err := r.db.
		Model(&model.UserProject{}).
		Where("project_id = ?", projectID).
		Distinct("user_id").
		Pluck("user_id", &ids).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user project IDs: %w", err)
	}

	return ids, nil
}

func (r *UserProjectRepository) UpdateTx(tx *gorm.DB, userProject *model.UserProject) error {
	if err := tx.Model(userProject).
		Updates(userProject).Error; err != nil {
		return fmt.Errorf("failed to updates user project: %w", err)
	}
	return nil
}

func (r *UserProjectRepository) DeleteTx(tx *gorm.DB, userProject *model.UserProject) error {
	if err := tx.Model(userProject).
		Delete(userProject).Error; err != nil {
		return fmt.Errorf("failed to delete user project: %w", err)
	}
	return nil
}
