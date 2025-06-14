package repo

import (
	"fmt"
	"webservices/src/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProjectSettingRepository struct {
	*baseRepository
}

func NewProjectSettingRepository(db *gorm.DB) *ProjectSettingRepository {
	return &ProjectSettingRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *ProjectSettingRepository) GetByProjectID(projectID string) (*model.ProjectSetting, error) {
	var setting model.ProjectSetting
	if err := r.db.First(&setting, "project_id = ?",
		projectID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch setting: %w", err)
	}

	return &setting, nil
}

func (r *ProjectSettingRepository) Updates(projectID string, values map[string]any) (*model.ProjectSetting, error) {
	var setting model.ProjectSetting

	result := r.db.
		Model(&setting).
		Where("project_id = ?", projectID).
		Clauses(clause.Returning{}).
		Updates(values)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to update setting: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		values["project_id"] = projectID
		if err := r.db.Model(&setting).Create(values).Error; err != nil {
			return nil, fmt.Errorf("failed to initialze setting: %w", err)
		}
	}

	return &setting, nil
}
