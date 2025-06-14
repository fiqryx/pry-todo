package model

import (
	"time"
	"webservices/src/types"
)

type UserProject struct {
	UserID    string                `gorm:"primaryKey;type:uuid" json:"userId"`
	ProjectID string                `gorm:"primaryKey;type:uuid" json:"projectId"`
	Role      types.UserProjectRole `gorm:"type:user_project_role;not null;default:'owner'" json:"role"`
	CreatedAt time.Time             `gorm:"column:created_at;default:now();<-:create" json:"createdAt"`
}

func (UserProject) TableName() string {
	return "user_projects"
}
