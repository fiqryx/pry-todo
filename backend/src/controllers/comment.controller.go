package controllers

import (
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/services"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type CommentController struct {
	commentService *services.CommentService
	notifService   *services.NotificationService
}

func NewCommentController(
	commentService *services.CommentService,
	notifService *services.NotificationService,
) *CommentController {
	return &CommentController{
		notifService:   notifService,
		commentService: commentService,
	}
}

func (ctrl *CommentController) GetComments(c *gin.Context) {
	issueID := c.Param("id")
	if issueID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	comments, err := ctrl.commentService.GetByIssue(issueID)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": comments})
}

func (ctrl *CommentController) Create(c *gin.Context) {
	issueID := c.Param("id")
	if issueID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateComment
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	comment, err := ctrl.commentService.Create(user.ID, issueID, body.Message)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	go ctrl.notifService.PushComment(user, *comment)

	c.AbortWithStatusJSON(200, gin.H{"data": comment})
}

func (ctrl *CommentController) Update(c *gin.Context) {
	issueID := c.Param("id")
	if issueID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	commentID := c.Param("comment_id")
	if commentID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateComment
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	comment, err := ctrl.commentService.Update(commentID, user.ID, body.Message)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
	}

	c.AbortWithStatusJSON(200, gin.H{"data": comment})
}

func (ctrl *CommentController) Delete(c *gin.Context) {
	issueID := c.Param("id")
	if issueID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	commentID := c.Param("comment_id")
	if commentID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	comment, err := ctrl.commentService.Delete(commentID, user.ID)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
	}

	c.AbortWithStatusJSON(200, gin.H{"data": comment})
}
