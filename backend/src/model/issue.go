package model

import (
	"time"
	"webservices/src/types"
)

type Issue struct {
	ID          string              `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ProjectID   string              `gorm:"type:uuid;column:project_id" json:"projectId"`
	Title       string              `gorm:"not null" json:"title"`
	Type        types.IssueType     `gorm:"type:issue_type;default:'task'" json:"type"`
	Priority    types.IssuePriority `gorm:"type:issue_priority;default:'medium'" json:"priority"`
	Status      types.IssueStatus   `gorm:"type:issue_status;default:'todo'" json:"status"`
	AssigneeID  *string             `gorm:"type:uuid;column:assignee_id" json:"assigneeId,omitempty"`
	ReporterID  *string             `gorm:"type:uuid;column:reporter_id" json:"reporterId,omitempty"`
	CreatorID   *string             `gorm:"type:uuid;column:creator_id" json:"creatorId,omitempty"`
	StartDate   *time.Time          `gorm:"column:start_date" json:"startDate,omitempty"`
	DueDate     *time.Time          `gorm:"column:due_date" json:"dueDate,omitempty"`
	DoneDate    *time.Time          `gorm:"column:done_date" json:"doneDate,omitempty"`
	Label       *string             `json:"label,omitempty"`
	Description *string             `json:"description,omitempty"`
	Goal        *string             `json:"goal,omitempty"`
	Parents     *string             `json:"parents,omitempty"`
	Order       int                 `gorm:"column:order_index;default:0" json:"order"`
	CreatedAt   time.Time           `gorm:"column:created_at;default:now();<-:create" json:"createdAt"`
	UpdatedAt   time.Time           `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`

	Project  Project `gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"project,omitzero"`
	Assignee *User   `gorm:"foreignKey:AssigneeID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"assignee,omitempty"`
	Reporter *User   `gorm:"foreignKey:ReporterID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"reporter,omitempty"`
	Creator  *User   `gorm:"foreignKey:CreatorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"creator,omitempty"`

	Comments   []Comment        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comments,omitempty"`
	Items      []IssueItem      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"items,omitempty"`
	Activities []RecentActivity `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"activities,omitempty"`
}

func (Issue) TableName() string {
	return "issues"
}
