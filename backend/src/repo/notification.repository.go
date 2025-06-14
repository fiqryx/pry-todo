package repo

import (
	"fmt"
	"webservices/src/model"

	"gorm.io/gorm"
)

type NotificationRepository struct {
	*baseRepository
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *NotificationRepository) GetByUserID(userID string) ([]model.Notification, error) {
	var notifications []model.Notification

	if err := r.db.
		Order("created_at DESC").
		Find(&notifications, "user_id = ?",
			userID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch notification: %w", err)
	}

	return notifications, nil
}

func (r NotificationRepository) Create(notif *model.Notification) error {
	return r.db.Create(notif).Error
}

func (r NotificationRepository) Read(ID string) error {
	if err := r.db.Table("notifications").
		Where("id = ?", ID).
		Update("is_read", true).
		Error; err != nil {
		return fmt.Errorf("failed to read notification: %w", err)
	}
	return nil
}

func (r NotificationRepository) ReadByUserID(userID string) error {
	if err := r.db.Table("notifications").
		Where("user_id = ?", userID).
		Update("is_read", true).
		Error; err != nil {
		return fmt.Errorf("failed to read notification: %w", err)
	}
	return nil
}
