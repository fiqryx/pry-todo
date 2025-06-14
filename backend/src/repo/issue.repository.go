package repo

import (
	"errors"
	"fmt"
	"strings"
	"time"
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IssueRepository struct {
	*baseRepository
}

func NewIssueRepository(db *gorm.DB) *IssueRepository {
	return &IssueRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *IssueRepository) GetByID(ID string) (*model.Issue, error) {
	var issue model.Issue
	if err := r.db.First(&issue, "id = ?", ID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch issue: %w", err)
	}

	return &issue, nil
}

func (r *IssueRepository) GetChildIDs(ID string) ([]string, error) {
	var ids []string

	if err := r.db.Model(&model.Issue{}).
		Select("id").
		Where("parents = ?", ID).
		Scan(&ids).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch child IDs: %w", err)
	}

	return ids, nil
}

// `preload` showing all data include the `issue_child`, `preload` usage for analytic
func (r *IssueRepository) GetByProjectID(preload bool, projectID string, parentID *string) ([]model.Issue, error) {
	var issues []model.Issue

	query := r.db.
		Where("project_id = ?", projectID).
		Order("order_index ASC")

	if preload {
		query = query.Preload("Activities", func(db *gorm.DB) *gorm.DB {
			return db.Joins("User")
		})
	} else {
		if parentID != nil && *parentID != "" {
			query = query.Where("parents = ?", parentID)
		} else {
			query = query.Where("parents IS NULL OR parents = ''")
		}
	}

	if err := query.Find(&issues).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch issues: %w", err)
	}

	return issues, nil
}

func (r *IssueRepository) GetWithFilter(projectID string, filter schemas.FilterIssue) ([]model.Issue, error) {
	var issues []model.Issue

	query := r.db.
		Where("project_id = ?", projectID).
		Order("updated_at DESC") // make sure orderBy is correct

	if filter.Search != nil && *filter.Search != "" {
		searchTerm := "%" + *filter.Search + "%"
		query = query.Where(
			"title LIKE ? OR description LIKE ?",
			searchTerm, searchTerm,
		)
	}

	if filter.UserID != nil && *filter.UserID != "" {
		query = query.Where("user_id LIKE %?%", filter.UserID)
	}

	if err := query.Find(&issues).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch issues: %w", err)
	}

	return issues, nil
}

func (r *IssueRepository) GetSequence(projectID string, parentID *string) (int, error) {
	var last model.Issue
	query := r.db.Model(&model.Issue{}).Where("project_id = ?", projectID)

	if parentID != nil {
		query = query.Where("parents = ?", *parentID)
	} else {
		query = query.Where("parents IS NULL OR parents = ''")
	}

	err := query.
		Order("order_index DESC").
		Select("order_index").
		First(&last).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to get last issue order: %w", err)
	}

	return last.Order + 1, nil
}

func (r *IssueRepository) CreateTx(tx *gorm.DB, issue *model.Issue) error {
	if err := tx.Create(issue).Error; err != nil {
		return fmt.Errorf("failed to create issue: %w", err)
	}

	return nil
}

func (r *IssueRepository) UpdateTx(tx *gorm.DB, issue *model.Issue) error {
	if issue.DoneDate != nil && issue.Status != types.IssueStatusDone {
		updates := map[string]any{
			"done_date":  nil,
			"updated_at": time.Now(),
		}

		if err := tx.Model(issue).Omit("Order").
			Updates(updates).Error; err != nil {
			return fmt.Errorf("failed to update issue: %w", err)
		}
	}

	updates := map[string]any{
		"title":       issue.Title,
		"description": issue.Description,
		"priority":    issue.Priority,
		"type":        issue.Type,
		"status":      issue.Status,
		"assignee_id": issue.AssigneeID,
		"reporter_id": issue.ReporterID,
		"label":       issue.Label,
		"goal":        issue.Goal,
		"parents":     issue.Parents,
		"updated_at":  time.Now(),
		"done_date":   issue.DoneDate,
	}

	if err := tx.Model(issue).Omit("Order").
		Clauses(clause.Returning{}).
		Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update issue: %w", err)
	}

	return nil
}

func (r *IssueRepository) UpdateWithOrderTx(tx *gorm.DB, issue *model.Issue) error {
	issue.UpdatedAt = time.Now()
	if err := tx.Save(issue).Error; err != nil {
		return fmt.Errorf("failed to update issue: %w", err)
	}
	return nil
}

func (r *IssueRepository) UpdateSequenceTx(tx *gorm.DB, issue *model.Issue, direction types.MoveDirection) ([]model.Issue, error) {
	issues, err := r.GetByProjectID(false, issue.ProjectID, issue.Parents)
	if err != nil {
		return nil, err
	}

	currentIndex := -1
	for i, item := range issues {
		if item.ID == issue.ID {
			currentIndex = i
			break
		}
	}

	if currentIndex == -1 {
		return nil, errors.New("issue not found in project")
	}

	newIndex := currentIndex
	switch direction {
	case types.DirectionTop:
		newIndex = 0
	case types.DirectionUp:
		newIndex = max(0, currentIndex-1)
	case types.DirectionDown:
		newIndex = min(len(issues)-1, currentIndex+1)
	case types.DirectionBottom:
		newIndex = len(issues) - 1
	}

	if newIndex == currentIndex {
		return issues, nil
	}

	issue.Order = newIndex

	reordered := make([]model.Issue, len(issues))
	copy(reordered, issues)
	moved := reordered[currentIndex]
	reordered = append(reordered[:currentIndex], reordered[currentIndex+1:]...)
	reordered = append(reordered[:newIndex], append([]model.Issue{moved}, reordered[newIndex:]...)...)

	var params []any
	var updateCases []string

	for i, item := range reordered {
		updateCases = append(updateCases, "WHEN ? THEN ?")
		params = append(params, item.ID, i)
	}

	ids := make([]string, len(reordered))
	for i, issue := range reordered {
		ids[i] = issue.ID
	}

	err = tx.Exec(
		`UPDATE issues SET order_index = CASE id `+strings.Join(updateCases, " ")+` END WHERE id IN ? `,
		append(params, ids)...,
	).Error

	if err != nil {
		return nil, fmt.Errorf("failed to update order indexes: %w", err)
	}

	for i := range reordered {
		reordered[i].Order = i
	}

	return reordered, nil
}

func (r *IssueRepository) RemoveParentTx(tx *gorm.DB, issue *model.Issue) error {
	if issue == nil {
		return fmt.Errorf("issue cannot be nil")
	}

	updateFields := map[string]any{
		"parents":     nil,
		"order_index": issue.Order,
	}

	if issue.Type == types.IssueTypeSubtask {
		updateFields["type"] = types.IssueTypeTask
	}

	result := r.db.Model(&model.Issue{}).
		Where("id = ?", issue.ID).
		Select("parents", "order_index", "type").
		Updates(updateFields)

	if result.Error != nil {
		return fmt.Errorf("failed to remove parent: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no issue found with ID %s", issue.ID)
	}

	issue.Parents = nil
	if issue.Type == types.IssueTypeSubtask {
		issue.Type = types.IssueTypeTask
	}

	return nil
}

func (r *IssueRepository) Heartbeat(ID string) {
	if err := r.db.Exec("UPDATE issues SET updated_at = ? WHERE id = ?",
		time.Now(), ID).Error; err != nil {
		logger.Errorf("failed to update issue timestamp: %s", err)
	}
}

func (r *IssueRepository) CountByUser(userID string, status types.IssueStatus) (int64, error) {
	var count int64
	err := r.db.Model(&model.Issue{}).
		Where("assignee_id = ? AND status != ?", userID, types.IssueStatusDone).
		Count(&count).
		Error

	if err != nil {
		return 0, fmt.Errorf("failed to count issues for user %s: %w", userID, err)
	}

	return count, nil
}

func (r *IssueRepository) DeleteByID(tx *gorm.DB, ID string) error {
	if err := tx.Delete(&model.Issue{},
		"id = ?", ID).Error; err != nil {
		return fmt.Errorf("failed to delete issue: %w", err)
	}
	return nil
}

func (r *IssueRepository) DeleteByParent(tx *gorm.DB, parentID string) error {
	if err := tx.Delete(&model.Issue{},
		"parents = ?", parentID).Error; err != nil {
		return fmt.Errorf("failed to delete issue: %w", err)
	}
	return nil
}
