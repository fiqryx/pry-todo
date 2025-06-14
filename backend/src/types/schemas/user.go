package schemas

type CreateUser struct {
	Name  string  `json:"name" binding:"required"`
	Email string  `json:"email" binding:"required"`
	Image *string `json:"image" binding:"omitempty"`
}

type UpdateUser struct {
	Name  string  `json:"name" binding:"required"`
	Image *string `json:"image" binding:"omitempty"`
}
