package model

import (
	"time"
	"webservices/src/types"
)

type Report struct {
	ID        string           `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID    string           `gorm:"type:uuid;not null" json:"userId"`
	Type      types.ReportType `gorm:"not null" json:"type"`
	Message   string           `json:"message"`
	CreatedAt time.Time        `gorm:"not null;default:now();<-:create" json:"createdAt"`
	UpdatedAt time.Time        `gorm:"not null;default:now()" json:"updatedAt"`

	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitzero"`
}

func (Report) TableName() string {
	return "reports"
}
