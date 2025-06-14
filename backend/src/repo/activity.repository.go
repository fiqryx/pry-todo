package repo

import (
	"fmt"
	"webservices/src/model"

	"gorm.io/gorm"
)

type ActivityRepository struct {
	*baseRepository
}

func NewActivityRepository(db *gorm.DB) *ActivityRepository {
	return &ActivityRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *ActivityRepository) GetByIssueID(issueID string) ([]model.RecentActivity, error) {
	var activities []model.RecentActivity
	if err := r.db.Joins("User").
		Order("created_at DESC").
		Find(&activities, "issue_id = ?", issueID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch activities: %w", err)
	}
	return activities, nil
}

func (r *ActivityRepository) GetByIssueIncludeChilds(issueID string, childIDs []string) ([]model.RecentActivity, error) {
	var activities []model.RecentActivity

	ids := make([]string, 0, len(childIDs)+1)
	ids = append(ids, issueID)
	if len(childIDs) > 0 {
		ids = append(ids, childIDs...)
	}

	if err := r.db.Joins("User").
		Order("created_at DESC").
		Find(&activities, "issue_id IN (?)", ids).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch activities: %w", err)
	}

	return activities, nil
}

func (r *ActivityRepository) Create(activity *model.RecentActivity) error {
	if err := r.db.Create(activity).Error; err != nil {
		return fmt.Errorf("failed to record activity: %w", err)
	}
	return nil
}

func (r *ActivityRepository) CreateTx(tx *gorm.DB, activity *model.RecentActivity) error {
	if err := tx.Create(activity).Error; err != nil {
		return fmt.Errorf("failed to record activity: %w", err)
	}
	return nil
}
