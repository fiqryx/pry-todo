package model

import (
	"time"
	"webservices/src/types"
)

type ProjectSetting struct {
	ID                     string                 `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ProjectID              string                 `gorm:"type:uuid;unique;column:project_id" json:"projectId"`
	AutoAssignment         bool                   `gorm:"column:auto_assignment;default:false" json:"autoAssignment"`
	AssignmentMethod       types.AssignmentMethod `gorm:"type:assignment_method;column:assignment_method;default:'round_robin'" json:"assignmentMethod"`
	DefaultIssuePriority   types.IssuePriority    `gorm:"type:issue_priority;column:default_issue_priority;default:'medium'" json:"defaultIssuePriority"`
	DefaultIssueStatus     types.IssueStatus      `gorm:"type:issue_status;column:default_issue_status;default:'todo'" json:"defaultIssueStatus"`
	EnableTimeTracking     bool                   `gorm:"column:enable_time_tracking;default:false" json:"enableTimeTracking"`
	TimeTrackingUnit       *types.TimeUnit        `gorm:"type:time_unit;column:time_tracking_unit;default:'hours'" json:"timeTrackingUnit,omitempty"`
	RequireDueDate         bool                   `gorm:"column:require_due_date;default:false" json:"requireDueDate"`
	DefaultDueDateOffset   int                    `gorm:"column:default_due_date_offset;default:7" json:"defaultDueDateOffset"`
	EnableApprovalWorkflow bool                   `gorm:"column:enable_approval_workflow;default:false" json:"enableApprovalWorkflow"`
	RequireDescription     bool                   `gorm:"column:require_description;default:true" json:"requireDescription"`
	AllowAttachments       bool                   `gorm:"column:allow_attachments;default:true" json:"allowAttachments"`
	MaxAttachmentSize      int                    `gorm:"column:max_attachment_size;default:10" json:"maxAttachmentSize"` // MB
	TaskLimitPerUser       int                    `gorm:"column:task_limit_per_user;default:5" json:"taskLimitPerUser"`
	NotifyOnAssignment     bool                   `gorm:"column:notify_on_assignment;default:true" json:"notifyOnAssignment"`
	NotifyOnStatusChange   bool                   `gorm:"column:notify_on_status_change;default:true" json:"notifyOnStatusChange"`
	NotifyOnDueDate        bool                   `gorm:"column:notify_on_due_date;default:true" json:"notifyOnDueDate"`
	NotifyOnOverdue        bool                   `gorm:"column:notify_on_overdue;default:true" json:"notifyOnOverdue"`
	DailyDigest            bool                   `gorm:"column:daily_digest;default:false" json:"dailyDigest"`
	CreatedAt              time.Time              `gorm:"column:created_at;default:now();<-:create" json:"-"`
	UpdatedAt              time.Time              `gorm:"column:updated_at;autoUpdateTime" json:"-"`

	Project Project `gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

func (ProjectSetting) TableName() string {
	return "project_settings"
}
