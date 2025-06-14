package repo

import (
	"fmt"
	"time"
	"webservices/src/model"

	"gorm.io/gorm"
)

type IssueItemRepository struct {
	*baseRepository
}

func NewIssueItemRepository(db *gorm.DB) *IssueItemRepository {
	return &IssueItemRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *IssueItemRepository) GetByIssueID(issueID string) ([]model.IssueItem, error) {
	var items []model.IssueItem
	if err := r.db.Order("created_at DESC").
		Find(&items, "issue_id = ?", issueID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch issue item: %w", err)
	}

	return items, nil
}

func (r *IssueItemRepository) GetByID(ID string) (*model.IssueItem, error) {
	var item model.IssueItem
	if err := r.db.Joins("Issue").
		First(&item, "issue_items.id = ?", ID).
		Error; err != nil {
		return nil, err
	}

	return &item, nil
}

func (r *IssueItemRepository) Create(item *model.IssueItem) error {
	return r.db.Create(item).Error
}

func (r *IssueItemRepository) CreateTx(tx *gorm.DB, item *model.IssueItem) error {
	return tx.Create(item).Error
}

func (r *IssueItemRepository) Update(item *model.IssueItem) error {
	item.UpdatedAt = time.Now()
	return r.db.Save(item).Error
}

func (r *IssueItemRepository) UpdateTx(tx *gorm.DB, item *model.IssueItem) error {
	item.UpdatedAt = time.Now()
	return tx.Save(item).Error
}

func (r *IssueItemRepository) Delete(ID string) error {
	return r.db.Delete(&model.IssueItem{}, "id = ?", ID).Error
}

func (r *IssueItemRepository) DeleteTx(tx *gorm.DB, ID string) error {
	return tx.Delete(&model.IssueItem{}, "id = ?", ID).Error
}
