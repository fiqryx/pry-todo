package schemas

import "webservices/src/types"

type CreateProject struct {
	ID          *string `json:"id" binding:"omitempty"`
	Name        string  `json:"name" binding:"required,max=30"`
	Image       *string `json:"image" binding:"omitempty"`
	Color       *string `json:"color" binding:"omitempty"`
	Description *string `json:"description" binding:"omitempty"`
}

type FilterProject struct {
	Search *string              `json:"search" binding:"omitempty"`
	Status *types.ProjectStatus `json:"status" binding:"omitempty"`
	Sort   *types.ProjectSort   `json:"sort" binding:"omitempty"`
}

type InviteProject struct {
	ID      *string               `json:"id" binding:"omitempty"`
	Email   string                `json:"email" binding:"required,email"`
	Role    types.UserProjectRole `json:"role" binding:"required,oneof=viewer editor admin"`
	Message string                `json:"message" binding:"omitempty"`
}

type UpdateAccess struct {
	UserID string                 `json:"userId" binding:"required"`
	Role   *types.UserProjectRole `json:"role" binding:"omitempty"`
}
