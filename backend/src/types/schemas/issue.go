package schemas

import "webservices/src/types"

type GetIssues struct {
	ProjectID string  `json:"projectId" binding:"required"`
	Parents   *string `json:"parents" binding:"omitempty"`
}

type IssueCount struct {
	UserID string `json:"userId"`
	Count  int    `json:"count"`
}

type IssueOrder struct {
	ID        string              `json:"id" binding:"required"`
	Direction types.MoveDirection `json:"direction" binding:"required"`
}

type CreateIssue struct {
	ID          *string             `json:"id" binding:"omitempty"`
	ProjectID   *string             `json:"projectId" binding:"omitempty" comments:"when empty fill with user.projectID"`
	Title       string              `json:"title" binding:"required"`
	Type        types.IssueType     `json:"type" binding:"omitempty"`
	Priority    types.IssuePriority `json:"priority" binding:"omitempty"`
	Status      types.IssueStatus   `json:"status" binding:"omitempty"`
	AssigneeID  *string             `json:"assigneeId" binding:"omitempty"`
	StartDate   *types.Date         `json:"startDate" binding:"omitempty"`
	DueDate     *types.Date         `json:"dueDate" binding:"omitempty"`
	Label       *string             `json:"label" binding:"omitempty"`
	Description *string             `json:"description" binding:"omitempty"`
	Goal        *string             `json:"goal" binding:"omitempty"`
	Parents     *string             `json:"parents" binding:"omitempty"`
}

type MoveParent struct {
	ID      string `json:"id" binding:"required"`
	Parents string `json:"parents" binding:"required"`
}

type FilterIssue struct {
	Search *string `json:"search" binding:"omitempty"`
	UserID *string `json:"userId" binding:"omitempty"`
}
