package schemas

type CreateComment struct {
	// ID string `json:"id" binding:"omitempty"`
	// IssueID string `json:"issueId" binding:"omitempty"`
	Message string `json:"message" binding:"required,min=1"`
}
