package types

var IssueTypes = []IssueType{
	IssueTypeTask,
	IssueTypeSubtask,
	IssueTypeBug,
	IssueTypeStory,
	IssueTypeEpic,
}

var ActivityTypes = []ActivityType{
	ProjectCreate,
	ProjectUpdate,
	ProjectDelete,
	IssueCreate,
	IssueUpdate,
	IssueDelete,
	IssueMove,
	CommentCreate,
	CommentUpdate,
	CommentDelete,
	SprintStart,
	SprintEnd,
	StatusChange,
	IssueChildrenCreate,
	IssueChildrenUpdate,
	IssueChildrenDelete,
	IssueItemCreate,
	IssueItemUpdate,
	IssueItemDelete,
	UserProjectUpdate,
	UserProjectDelete,
}

var NotificationTypes = []NotificationType{
	NotificationSystem,
	NotificationMessage,
	NotificationTask,
	NotificationComment,
}
