package model

import "time"

type Comment struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID    string    `gorm:"type:uuid" json:"userId"`
	IssueID   string    `gorm:"type:uuid" json:"issueId"`
	Message   string    `json:"message"`
	CreatedAt time.Time `gorm:"column:created_at;default:now();<-:create" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	User  User  `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitzero"`
	Issue Issue `gorm:"foreignKey:IssueID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"issue,omitzero"`

	Activities []RecentActivity `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"activities,omitempty"`
}

func (Comment) TableName() string {
	return "comments"
}
