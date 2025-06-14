package controllers

import (
	"strconv"
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/services"
	"webservices/src/types/schemas"

	"github.com/gin-gonic/gin"
)

type ReportController struct {
	reportService *services.ReportService
}

func NewReportController(
	reportService *services.ReportService,
) *ReportController {
	return &ReportController{
		reportService: reportService,
	}
}

func (ctrl *ReportController) GetReports(c *gin.Context) {
	defaultLimit := 10
	defaultOffset := 0

	limitStr := c.Query("limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = defaultLimit
	}

	offsetStr := c.Query("offset")
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = defaultOffset
	}

	if limit > 100 {
		limit = 100
	}

	reports, err := ctrl.reportService.GetReports(limit, offset)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": reports})
}

func (ctrl *ReportController) GetByID(c *gin.Context) {
	ID := c.Param("id")
	if ID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	report, err := ctrl.reportService.GetByID(ID)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(400, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": report})
}

func (ctrl *ReportController) Create(c *gin.Context) {
	var user model.User
	if err := user.GetContext(c); err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var body schemas.CreateReport
	if err := c.ShouldBindJSON(&body); err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	report, err := ctrl.reportService.Create(user.ID, body.Message, body.Type)
	if err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"data": report})
}

func (ctrl *ReportController) Delete(c *gin.Context) {
	ID := c.Param("id")
	if ID == "" {
		c.AbortWithStatusJSON(404, gin.H{"error": "not found"})
		return
	}

	if err := ctrl.reportService.Delete(ID); err != nil {
		logger.Error(err)
		c.AbortWithStatusJSON(500, gin.H{"error": err.Error()})
		return
	}

	c.AbortWithStatusJSON(200, gin.H{"message": "delete successfully"})
}
