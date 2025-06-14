package controllers

import (
	"webservices/src/model"
	"webservices/src/services"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	userService *services.UserService
}

func NewUserController(userService *services.UserService) *UserController {
	return &UserController{userService: userService}
}

func (ctrl *UserController) GetUser(c *gin.Context) {
	var ctx types.UserSupabase
	if err := ctx.Get(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByID(ctx.ID.String())
	if err != nil {
		c.AbortWithStatusJSON(403, gin.H{"error": "Unregistered"})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"user": user})
}

func (ctrl *UserController) RegisterUser(c *gin.Context) {
	var ctx types.UserSupabase
	if err := ctx.Get(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateUser
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	user, err := ctrl.userService.RegisterUserSupabase(
		ctx.ID.String(), body.Name, body.Email, body.Image)

	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(201, gin.H{"data": user})
}

func (ctrl *UserController) UpdateUser(c *gin.Context) {
	var ctx model.User
	if err := ctx.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.UpdateUser
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "Bad request"})
		return
	}

	user, err := ctrl.userService.Update(ctx.ID, body.Name, body.Image)
	if err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(201, gin.H{"data": user})
}
