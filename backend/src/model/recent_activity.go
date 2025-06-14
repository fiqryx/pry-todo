package model

import (
	"time"
	"webservices/src/types"

	"gorm.io/datatypes"
)

type RecentActivity struct {
	ID           string             `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID       string             `gorm:"type:uuid;not null" json:"userId"`
	ProjectID    *string            `gorm:"type:uuid" json:"projectId,omitempty"`
	IssueID      *string            `gorm:"type:uuid" json:"issueId,omitempty"`
	CommentID    *string            `gorm:"type:uuid" json:"commentId,omitempty"`
	ItemID       *string            `gorm:"type:uuid" json:"itemId,omitempty"`
	ActivityType types.ActivityType `gorm:"type:activity_type;not null" json:"type"`
	OldValues    *datatypes.JSONMap `gorm:"type:jsonb" json:"old,omitempty"`
	NewValues    *datatypes.JSONMap `gorm:"type:jsonb" json:"new,omitempty"`
	CreatedAt    time.Time          `gorm:"not null;default:now();<-:create" json:"createdAt"`
	UpdatedAt    time.Time          `gorm:"not null;default:now()" json:"updatedAt"`

	User    User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitzero"`
	Project Project   `gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"project,omitzero"`
	Issue   Issue     `gorm:"foreignKey:IssueID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"issue,omitzero"`
	Comment Comment   `gorm:"foreignKey:CommentID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"comment,omitzero"`
	Item    IssueItem `gorm:"foreignKey:ItemID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"item,omitzero"`
}

func (RecentActivity) TableName() string {
	return "recent_activities"
}
