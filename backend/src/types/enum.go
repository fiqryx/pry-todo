package types

import "strings"

type ProjectStatus string

const (
	ProjectStatusActive   ProjectStatus = "active"
	ProjectStatusInactive ProjectStatus = "inactive"
	ProjectStatusDone     ProjectStatus = "done"
)

type IssueStatus string

const (
	IssueStatusDraft      IssueStatus = "draft"
	IssueStatusTodo       IssueStatus = "todo"
	IssueStatusOnProgress IssueStatus = "on_progress"
	IssueStatusDone       IssueStatus = "done"
)

func (s IssueStatus) ToString() string {
	return strings.ReplaceAll(string(s), "_", " ")
}

type IssuePriority string

const (
	IssuePriorityLowest  IssuePriority = "lowest"
	IssuePriorityLow     IssuePriority = "low"
	IssuePriorityMedium  IssuePriority = "medium"
	IssuePriorityHigh    IssuePriority = "high"
	IssuePriorityHighest IssuePriority = "highest"
)

type AssignmentMethod string

const (
	AssignmentMethodRoundRobin AssignmentMethod = "round_robin"
	AssignmentMethodLeastBusy  AssignmentMethod = "least_busy"
	AssignmentMethodRandom     AssignmentMethod = "random"
)

type TimeUnit string

const (
	TimeUnitMinutes TimeUnit = "minutes"
	TimeUnitHours   TimeUnit = "hours"
	TimeUnitDays    TimeUnit = "days"
)

type ProjectSort string

const (
	SortByName    ProjectSort = "name"
	SortByCreated ProjectSort = "created_at"
	SortByUpdated ProjectSort = "updated_at"
)

type MoveDirection string

const (
	DirectionTop    MoveDirection = "top"
	DirectionUp     MoveDirection = "up"
	DirectionDown   MoveDirection = "down"
	DirectionBottom MoveDirection = "bottom"
)

type IssueItemType string

const (
	Attachment IssueItemType = "attachment"
	WebLink    IssueItemType = "web_link"
	LinkWork   IssueItemType = "link_work"
)

type ActivityType string

const (
	ProjectCreate       ActivityType = "project_create"
	ProjectUpdate       ActivityType = "project_update"
	ProjectDelete       ActivityType = "project_delete"
	IssueCreate         ActivityType = "issue_create"
	IssueUpdate         ActivityType = "issue_update"
	IssueDelete         ActivityType = "issue_delete"
	IssueMove           ActivityType = "issue_move"
	CommentCreate       ActivityType = "comment_create"
	CommentUpdate       ActivityType = "comment_update"
	CommentDelete       ActivityType = "comment_delete"
	SprintStart         ActivityType = "sprint_start"
	SprintEnd           ActivityType = "sprint_end"
	StatusChange        ActivityType = "status_change"
	IssueChildrenCreate ActivityType = "issue_children_create"
	IssueChildrenUpdate ActivityType = "issue_children_update"
	IssueChildrenDelete ActivityType = "issue_children_delete"
	IssueItemCreate     ActivityType = "issue_item_create"
	IssueItemUpdate     ActivityType = "issue_item_update"
	IssueItemDelete     ActivityType = "issue_item_delete"
	UserProjectUpdate   ActivityType = "user_project_update"
	UserProjectDelete   ActivityType = "user_project_delete"
)

func (a ActivityType) String() string {
	return string(a)
}

func (a ActivityType) StringQ() string {
	return string("'" + a + "'")
}

type NotificationType string

const (
	NotificationSystem  NotificationType = "system"
	NotificationMessage NotificationType = "message"
	NotificationTask    NotificationType = "task"
	NotificationComment NotificationType = "comment"
)

func (n NotificationType) String() string {
	return string(n)
}

func (n NotificationType) StringQ() string {
	return string("'" + n + "'")
}

type UserProjectRole string

const (
	RoleViewer UserProjectRole = "viewer" // view only
	RoleEditor UserProjectRole = "editor" // view and edit
	RoleAdmin  UserProjectRole = "admin"  // full project administration
	RoleOwner  UserProjectRole = "owner"  // project ownership
)

func (v UserProjectRole) String() string {
	return string(v)
}

var LevelUserProjectRole = map[UserProjectRole]int{
	RoleViewer: 0,
	RoleEditor: 1,
	RoleAdmin:  2,
	RoleOwner:  3,
}

type IssueType string

const (
	IssueTypeTask    IssueType = "task"
	IssueTypeSubtask IssueType = "subtask"
	IssueTypeBug     IssueType = "bug"
	IssueTypeStory   IssueType = "story"
	IssueTypeEpic    IssueType = "epic"
)

func (v IssueType) String() string {
	return string(v)
}

func (v IssueType) StringQ() string {
	return string("'" + v + "'")
}

type ReportType string

const (
	ReportTypeFeedback ReportType = "feedback"
	ReportTypeBug      ReportType = "bug"
	ReportTypeFeature  ReportType = "feature"
	ReportTypeOther    ReportType = "other"
)
