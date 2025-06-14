package repo

import (
	"fmt"
	"time"
	"webservices/src/model"

	"gorm.io/gorm"
)

type CommentRepository struct {
	*baseRepository
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *CommentRepository) GetByIssueID(issueID string) ([]model.Comment, error) {
	var comments []model.Comment
	if err := r.db.Joins("User").
		Order("created_at DESC").
		Find(&comments, "issue_id = ?", issueID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch comment: %w", err)
	}
	return comments, nil
}

func (r *CommentRepository) GetByID(ID string) (*model.Comment, error) {
	var comment model.Comment
	if err := r.db.Joins("Issue").
		First(&comment, "comments.id = ?", ID).
		Error; err != nil {
		return nil, fmt.Errorf("failed to fetch comment: %w", err)
	}

	return &comment, nil
}

func (r *CommentRepository) GetUserIDs(issueID, userID string) ([]string, error) {
	var ids []string

	if err := r.db.Model(&model.Comment{}).
		Where("issue_id = ? AND  user_id != ?", issueID, userID).
		Distinct("user_id").
		Pluck("user_id", &ids).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch user comments: %w", err)
	}

	return ids, nil
}

func (r *CommentRepository) Create(comment *model.Comment) error {
	return r.CreateTx(r.db, comment)
}

func (r *CommentRepository) CreateTx(tx *gorm.DB, comment *model.Comment) error {
	if err := tx.Create(comment).Error; err != nil {
		return fmt.Errorf("failed to create comment: %w", err)
	}
	return nil
}

func (r *CommentRepository) Update(comment *model.Comment) error {
	comment.UpdatedAt = time.Now()
	return r.db.Save(comment).Error
}

func (r *CommentRepository) UpdateTx(tx *gorm.DB, comment *model.Comment) error {
	comment.UpdatedAt = time.Now()
	return tx.Save(comment).Error
}

func (r *CommentRepository) Delete(ID string) error {
	return r.db.Delete(&model.Comment{}, "id = ?", ID).Error
}

func (r *CommentRepository) DeleteTx(tx *gorm.DB, ID string) error {
	return tx.Delete(&model.Comment{}, "id = ?", ID).Error
}
