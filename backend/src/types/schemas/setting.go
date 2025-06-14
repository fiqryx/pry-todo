package schemas

// Allowed field on the project_settings to updates
var SettingMap = map[string]string{
	"autoAssignment":         "auto_assignment",
	"assignmentMethod":       "assignment_method",
	"defaultIssuePriority":   "default_issue_priority",
	"defaultIssueStatus":     "default_issue_status",
	"enableTimeTracking":     "enable_time_tracking",
	"timeTrackingUnit":       "time_tracking_unit",
	"requireDueDate":         "require_due_date",
	"defaultDueDateOffset":   "default_due_date_offset",
	"enableApprovalWorkflow": "enable_approval_workflow",
	"requireDescription":     "require_description",
	"allowAttachments":       "allow_attachments",
	"maxAttachmentSize":      "max_attachment_size",
	"taskLimitPerUser":       "task_limit_per_user",
	"notifyOnAssignment":     "notify_on_assignment",
	"notifyOnStatusChange":   "notify_on_status_change",
	"notifyOnDueDate":        "notify_on_due_date",
	"notifyOnOverdue":        "notify_on_overdue",
	"dailyDigest":            "daily_digest",
}
