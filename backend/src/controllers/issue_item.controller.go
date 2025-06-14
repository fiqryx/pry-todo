package controllers

import (
	"strings"
	"webservices/src/model"
	"webservices/src/services"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type IssueItemController struct {
	itemService *services.IssueItemService
}

func NewIssueItemController(itemService *services.IssueItemService) *IssueItemController {
	return &IssueItemController{
		itemService: itemService,
	}
}

func (ctrl *IssueItemController) GetItems(c *gin.Context) {
	issueID := c.Param("id")
	if issueID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	items, err := ctrl.itemService.GetByIssue(issueID)
	if err != nil {
		statusCode := 500
		if strings.Contains(err.Error(), "not found") {
			statusCode = 404
		}
		c.AbortWithStatusJSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": items})
}

func (ctrl *IssueItemController) Create(c *gin.Context) {
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

	var body schemas.CreateItem
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	item, err := ctrl.itemService.Create(user.ID, issueID, body)
	if err != nil {
		statusCode := 500
		if strings.Contains(err.Error(), "not found") {
			statusCode = 404
		}
		c.AbortWithStatusJSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": item})
}

func (ctrl *IssueItemController) Update(c *gin.Context) {
	issueID := c.Param("id")
	itemID := c.Param("item_id")

	if issueID == "" || itemID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateItem
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	item, err := ctrl.itemService.Update(itemID, user.ID, issueID, body)
	if err != nil {
		statusCode := 500
		if strings.Contains(err.Error(), "not found") {
			statusCode = 404
		}
		c.AbortWithStatusJSON(statusCode, gin.H{"error": err.Error()})
	}

	c.AbortWithStatusJSON(200, gin.H{"data": item})
}

func (ctrl *IssueItemController) Delete(c *gin.Context) {
	issueID := c.Param("id")
	itemID := c.Param("item_id")

	if issueID == "" || itemID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	item, err := ctrl.itemService.Delete(itemID, user.ID)
	if err != nil {
		statusCode := 500
		if strings.Contains(err.Error(), "not found") {
			statusCode = 404
		}
		c.AbortWithStatusJSON(statusCode, gin.H{"error": err.Error()})
	}

	c.AbortWithStatusJSON(200, gin.H{"data": item})
}
