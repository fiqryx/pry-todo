package repo

import (
	"errors"
	"fmt"
	"webservices/src/model"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"gorm.io/gorm"
)

type ProjectRepository struct {
	*baseRepository
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *ProjectRepository) GetByID(ID string) (*model.Project, error) {
	var project model.Project
	if err := r.db.First(&project, "id = ?", ID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to found project: %w", err)
	}

	return &project, nil
}

func (r *ProjectRepository) GetIncludeDetail(ID string) (*model.Project, error) {
	return r.GetIncludeDetailTx(r.db, ID)
}

func (r *ProjectRepository) GetIncludeDetailTx(tx *gorm.DB, ID string) (*model.Project, error) {
	if ID == "" {
		return nil, fmt.Errorf("project ID cannot be empty")
	}

	var project model.Project
	err := tx.
		Joins("Setting").
		Preload("Users").
		First(&project, "projects.id = ?", ID).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to found project: %w", err)
		}
		return nil, fmt.Errorf("failed to fetch project: %w", err)
	}

	if project.Setting == nil {
		setting := model.ProjectSetting{ProjectID: ID}
		if err := tx.Create(&setting).Error; err != nil {
			return nil, fmt.Errorf("failed to create default setting: %w", err)
		}
		project.Setting = &setting
	}

	return &project, nil
}

func (r *ProjectRepository) GetIncludeRole(userID, projectID string) (*model.Project, error) {
	var project model.Project

	if err := r.db.
		Select("p.*", "u.role").
		Table("projects as p").
		Joins("JOIN user_projects as u ON u.project_id = p.id").
		First(&project, "u.user_id = ? AND u.project_id = ?", userID, projectID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to found project: %w", err)
	}

	return &project, nil
}

func (r *ProjectRepository) GetWithFilterByUserID(userID string, filter schemas.FilterProject) ([]model.Project, error) {
	var projects []model.Project

	query := r.db.
		Select("p.*", "u.role").
		Table("projects as p").
		Joins("JOIN user_projects as u ON u.project_id = p.id").
		Where("u.user_id = ?", userID)

	if filter.Search != nil {
		searchTerm := "%" + *filter.Search + "%"
		query = query.Where(
			"p.name LIKE ? OR p.description LIKE ?",
			searchTerm, searchTerm,
		)
	}

	if filter.Status != nil {
		query = query.Where("p.status = ?", *filter.Status)
	}

	if filter.Sort != nil {
		sortField := *filter.Sort
		switch sortField {
		case "name":
			query = query.Order("p.name ASC")
		case "updated_at", "updatedAt":
			query = query.Order("p.updated_at DESC")
		default:
			query = query.Order("p.created_at ASC")
		}
	} else {
		query = query.Order("p.created_at ASC")
	}

	if err := query.Find(&projects).Error; err != nil {
		return nil, fmt.Errorf("failed to find projects: %w", err)
	}

	return projects, nil
}

func (r *ProjectRepository) GetIncludeUsers(projectID, userID string) (*model.Project, error) {
	if userID == "" || projectID == "" {
		return nil, fmt.Errorf("failed to switch: parameter is empty")
	}

	var project model.Project

	if err := r.db.
		Table("projects as p").
		Joins("Setting").
		Joins("JOIN user_projects as u ON u.project_id = p.id").
		Preload("Users").
		First(&project, "p.id = ? AND u.user_id = ?", projectID, userID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch project: %w", err)
	}

	var userProjects []model.UserProject
	if err := r.db.Find(&userProjects, "project_id = ?",
		projectID).Error; err != nil {
		return nil, err
	}

	roles := make(map[string]types.UserProjectRole)
	for _, up := range userProjects {
		roles[up.UserID] = up.Role
		if userID == up.UserID {
			project.Role = up.Role
		}
	}

	for i, v := range project.Users {
		if role, exists := roles[v.ID]; exists {
			project.Users[i].Role = role
		}
	}

	return &project, nil
}

func (r *ProjectRepository) GetReplacment(projectID, userID string) *model.Project {
	var project model.Project

	r.db.Table("projects as p").
		Joins("JOIN user_projects as u ON u.project_id = p.id").
		Where("u.user_id = ? AND p.id != ?", userID, projectID).
		Order("projects.updated_at DESC").
		First(&project)

	if project.ID == "" {
		return nil
	}

	return &project
}

func (r *ProjectRepository) Save(project *model.Project) error {
	return r.db.Save(project).Error
}

func (r *ProjectRepository) SaveTx(tx *gorm.DB, project *model.Project) error {
	return tx.Save(project).Error
}

func (r *ProjectRepository) UpdateLastAssigned(ID string, value int) error {
	if err := r.db.Model(&model.Project{}).
		Where("id = ?", ID).
		Updates(map[string]any{"last_assigned_index": value}).
		Error; err != nil {
		return fmt.Errorf("failed to update last assigned: %w", err)
	}

	return nil
}

func (r *ProjectRepository) Delete(projectID string) error {
	return r.DeleteTx(r.db, projectID)
}

func (r *ProjectRepository) DeleteTx(tx *gorm.DB, projectID string) error {
	var project *model.Project

	if err := tx.
		Exec("DELETE FROM user_projects WHERE project_id = ?", projectID).
		Error; err != nil {
		return fmt.Errorf("failed to clear user associations: %w", err)
	}

	if err := tx.
		Select("Setting", "Issues").
		Delete(&project, "id = ?", projectID).
		Error; err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	return nil
}
