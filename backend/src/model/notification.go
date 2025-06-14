package model

import (
	"time"
	"webservices/src/types"

	"gorm.io/datatypes"
)

type Notification struct {
	ID        string                 `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID    string                 `gorm:"type:uuid;not null;" json:"userId"`
	Type      types.NotificationType `gorm:"type:notification_type;not null;" json:"type"`
	Title     string                 `gorm:"not null" json:"title"`
	Message   string                 `json:"message,omitempty"`
	IsRead    bool                   `gorm:"default:false;" json:"isRead"`
	Metadata  datatypes.JSONMap      `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt time.Time              `gorm:"type:timestamptz;default:now();<-:create" json:"createdAt"`
	ExpiresAt *time.Time             `gorm:"type:timestamptz" json:"expiresAt,omitempty"`

	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitzero"`
}

func (Notification) TableName() string {
	return "notifications"
}
