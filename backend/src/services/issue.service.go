package services

import (
	"fmt"
	"math/rand"
	"time"
	"webservices/src/model"
	"webservices/src/pkg/common"
	"webservices/src/repo"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type IssueService struct {
	issueRepo    *repo.IssueRepository
	userRepo     *repo.UserRepository
	projectRepo  *repo.ProjectRepository
	activityRepo *repo.ActivityRepository
}

func NewIssueService(
	issueRepo *repo.IssueRepository,
	userRepo *repo.UserRepository,
	projectRepo *repo.ProjectRepository,
	activityRepo *repo.ActivityRepository,
) *IssueService {
	return &IssueService{
		issueRepo:    issueRepo,
		userRepo:     userRepo,
		projectRepo:  projectRepo,
		activityRepo: activityRepo,
	}
}

func (s *IssueService) GetIssue(ID string) (*model.Issue, error) {
	return s.issueRepo.GetByID(ID)
}

func (s *IssueService) GetByProject(projectID string) ([]model.Issue, error) {
	return s.issueRepo.GetByProjectID(true, projectID, nil)
}

func (s *IssueService) GetWithParents(projectID, parentID string) ([]model.Issue, error) {
	return s.issueRepo.GetByProjectID(false, projectID, &parentID)
}

func (s *IssueService) GetWithFilter(projectID string, filter schemas.FilterIssue) ([]model.Issue, error) {
	return s.issueRepo.GetWithFilter(projectID, filter)
}

func (s *IssueService) GetActivities(ID string) ([]model.RecentActivity, error) {
	childs, err := s.issueRepo.GetChildIDs(ID)
	if err != nil {
		return nil, err
	}
	return s.activityRepo.GetByIssueIncludeChilds(ID, childs)
}

func (s *IssueService) Create(userID string, value schemas.CreateIssue) (*model.Issue, error) {
	issue := model.Issue{
		ProjectID:   *value.ProjectID,
		Title:       value.Title,
		Priority:    value.Priority,
		Type:        value.Type,
		Status:      value.Status,
		AssigneeID:  value.AssigneeID,
		ReporterID:  &userID,
		CreatorID:   &userID,
		Label:       value.Label,
		Description: value.Description,
		Parents:     value.Parents,
	}

	if value.StartDate != nil {
		issue.StartDate = &value.StartDate.Time
	}

	if value.DueDate != nil {
		issue.DueDate = &value.DueDate.Time
	}

	if issue.Status == types.IssueStatusOnProgress ||
		issue.Status == types.IssueStatusDone {
		issue.StartDate = common.Ptr(time.Now())
	}

	if err := s.prepare(userID, &issue, true); err != nil {
		return nil, err
	}

	err := s.issueRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.issueRepo.CreateTx(tx, &issue); err != nil {
			return err
		}

		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &issue.ProjectID,
			IssueID:      &issue.ID,
			ActivityType: types.IssueCreate,
			NewValues: &datatypes.JSONMap{
				"title":       issue.Title,
				"description": issue.Description,
				"type":        issue.Type,
				"priority":    issue.Priority,
				"status":      issue.Status,
				"assignee":    issue.AssigneeID,
				"reporter":    issue.ReporterID,
				"creator":     issue.CreatorID,
				"parents":     issue.Parents,
				"start_date":  issue.StartDate,
				"due_date":    issue.DueDate,
			},
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	if issue.Parents != nil && *issue.Parents != "" {
		s.issueRepo.Heartbeat(*issue.Parents)
	}

	return &issue, nil
}

func (s *IssueService) Update(userID string, value schemas.CreateIssue) (*model.Issue, error) {
	if value.ID == nil || *value.ID == "" {
		return nil, fmt.Errorf("failed to update issue: invalid parameter")
	}

	issue := model.Issue{
		ID:          *value.ID,
		ProjectID:   *value.ProjectID,
		Title:       value.Title,
		Priority:    value.Priority,
		Type:        value.Type,
		Status:      value.Status,
		AssigneeID:  value.AssigneeID,
		ReporterID:  &userID,
		Label:       value.Label,
		Description: value.Description,
		Goal:        value.Goal,
		Parents:     value.Parents,
	}

	if value.StartDate != nil {
		issue.StartDate = &value.StartDate.Time
	}

	if value.DueDate != nil {
		issue.DueDate = &value.DueDate.Time
	}

	prev, err := s.issueRepo.GetByID(issue.ID)
	if err != nil {
		return nil, err
	}

	// autofill start date (optional add project_setting statement: enable_autofill_date)
	if prev.StartDate == nil && issue.StartDate == nil &&
		prev.Status == types.IssueStatusTodo &&
		issue.Status != types.IssueStatusTodo {
		issue.StartDate = common.Ptr(time.Now())
	}

	if prev.Status != types.IssueStatusDone &&
		issue.Status == types.IssueStatusDone {
		issue.DoneDate = common.Ptr(time.Now())
	}

	if prev.Status == types.IssueStatusDone &&
		issue.Status != types.IssueStatusDone &&
		prev.DoneDate != nil {
		issue.DoneDate = prev.DoneDate
	}

	if err := s.prepare(userID, &issue, false); err != nil {
		return nil, err
	}

	err = s.issueRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.issueRepo.UpdateTx(tx, &issue); err != nil {
			return err
		}

		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &issue.ProjectID,
			IssueID:      &issue.ID,
			ActivityType: types.IssueUpdate,
			OldValues: &datatypes.JSONMap{
				"title":       prev.Title,
				"description": prev.Description,
				"type":        prev.Type,
				"priority":    prev.Priority,
				"status":      prev.Status,
				"assignee":    prev.AssigneeID,
				"reporter":    prev.ReporterID,
				"creator":     prev.CreatorID,
				"parents":     prev.Parents,
				"start_date":  prev.StartDate,
				"due_date":    prev.DueDate,
			},
			NewValues: &datatypes.JSONMap{
				"title":       issue.Title,
				"description": issue.Description,
				"type":        issue.Type,
				"priority":    issue.Priority,
				"status":      issue.Status,
				"assignee":    issue.AssigneeID,
				"reporter":    issue.ReporterID,
				"creator":     issue.CreatorID,
				"parents":     issue.Parents,
				"start_date":  issue.StartDate,
				"due_date":    issue.DueDate,
			},
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	if issue.Parents != nil && *issue.Parents != "" {
		s.issueRepo.Heartbeat(*issue.Parents)
	}

	return &issue, nil
}

func (s *IssueService) UpdateSequence(userID, issueID string, direction types.MoveDirection) ([]model.Issue, error) {
	issue, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		issue.ProjectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &issue.ProjectID,
		IssueID:      &issue.ID,
		ActivityType: types.IssueMove,
		OldValues: &datatypes.JSONMap{
			"order":   issue.Order,
			"parents": issue.Parents,
		},
	}

	var issues []model.Issue
	err = s.issueRepo.DB().Transaction(func(tx *gorm.DB) error {
		issues, err = s.issueRepo.UpdateSequenceTx(tx, issue, direction)
		if err != nil {
			return err
		}

		activity.NewValues = &datatypes.JSONMap{
			"order":    issue.Order,
			"parents":  issue.Parents,
			"affected": len(issues),
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return issues, nil
}

func (s *IssueService) UpdateParent(userID, issueID, parentID string) (*model.Issue, error) {
	child, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		child.ProjectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	if child.Parents == &parentID {
		return nil, fmt.Errorf("failed to update: nothing has changed")
	}

	parent, err := s.issueRepo.GetByID(parentID)
	if err != nil {
		return nil, err
	}

	if child.ProjectID != parent.ProjectID {
		return nil, fmt.Errorf("failed to update: cross-project not allowed")
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &child.ProjectID,
		IssueID:      &child.ID,
		ActivityType: types.IssueMove,
		OldValues: &datatypes.JSONMap{
			"title":       child.Title,
			"description": child.Description,
			"type":        child.Type,
			"priority":    child.Priority,
			"status":      child.Status,
			"assignee":    child.AssigneeID,
			"reporter":    child.ReporterID,
			"parents":     child.Parents,
			"order":       child.Order,
			"message":     "update parent",
		},
	}

	if child.Type == types.IssueTypeTask {
		child.Type = types.IssueTypeSubtask
	}

	err = s.issueRepo.DB().Transaction(func(tx *gorm.DB) error {
		child.Parents = &parent.ID
		order, err := s.issueRepo.GetSequence(child.ProjectID, &parentID)
		if err != nil {
			return err
		}
		child.Order = order

		if err := s.issueRepo.UpdateWithOrderTx(tx, child); err != nil {
			return err
		}

		activity.NewValues = &datatypes.JSONMap{
			"title":       child.Title,
			"description": child.Description,
			"type":        child.Type,
			"priority":    child.Priority,
			"status":      child.Status,
			"assignee":    child.AssigneeID,
			"reporter":    child.ReporterID,
			"parents":     parent.ID,
			"order":       child.Order,
			"message":     "update parent",
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return child, nil
}

func (s *IssueService) GetAssigment(issue *model.Issue, project *model.Project) (*string, error) {
	if issue.AssigneeID != nil && *issue.AssigneeID != "" {
		return issue.AssigneeID, nil
	}

	if !project.Setting.AutoAssignment {
		return nil, nil
	}

	switch project.Setting.AssignmentMethod {
	case types.AssignmentMethodRandom:
		return s.random(project.Users), nil
	case types.AssignmentMethodRoundRobin:
		return s.raoundRobin(project, project.Users)
	case types.AssignmentMethodLeastBusy:
		return s.leastBusy(project.Users)
	default:
		return nil, fmt.Errorf("unknown assignment method: %s", project.Setting.AssignmentMethod)
	}
}

func (s *IssueService) RemoveParent(userID, issueID string) (*model.Issue, error) {
	issue, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		issue.ProjectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &issue.ProjectID,
		IssueID:      issue.Parents,
		ActivityType: types.IssueMove,
		OldValues: &datatypes.JSONMap{
			"issue_id": issue.ID,
			"parents":  issue.Parents,
			"message":  "remove parent",
		},
	}

	err = s.issueRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.issueRepo.RemoveParentTx(tx, issue); err != nil {
			return err
		}

		activity.NewValues = &datatypes.JSONMap{
			"issue_id": issue.ID,
			"parents":  issue.Parents,
			"message":  "remove parent",
		}

		_, err = s.issueRepo.UpdateSequenceTx(tx, issue, types.DirectionBottom)
		if err != nil {
			return err
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return issue, nil
}

func (s *IssueService) Delete(userID, issueID string) error {
	issue, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return err
	}

	if issue.Status != types.IssueStatusTodo {
		message := "in progress"
		if issue.Status == types.IssueStatusDone {
			message = "completed"
		}
		return fmt.Errorf("can't delete %s issue", message)
	}

	if err := s.userRepo.ValidatePermission(userID,
		issue.ProjectID, types.RoleAdmin); err != nil {
		return err
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &issue.ProjectID,
		IssueID:      &issue.ID,
		ActivityType: types.IssueDelete,
		OldValues: &datatypes.JSONMap{
			"title":       issue.Title,
			"description": issue.Description,
			"status":      issue.Status,
			"priority":    issue.Priority,
			"assignee":    issue.AssigneeID,
			"reporter":    issue.ReporterID,
			"parents":     issue.Parents,
		},
	}

	if issue.Parents != nil {
		activity.ActivityType = types.IssueChildrenDelete
		activity.OldValues = &datatypes.JSONMap{
			"parent_issue_id":    issue.ID,
			"parent_issue_title": issue.Title,
		}
	}

	err = s.issueRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.activityRepo.CreateTx(tx, &activity); err != nil {
			return err
		}

		if issue.Parents == nil {
			if err := s.issueRepo.DeleteByParent(tx, issue.ID); err != nil {
				return err
			}
		}

		_, err = s.issueRepo.UpdateSequenceTx(tx, issue, types.DirectionBottom)
		if err != nil {
			return err
		}

		return s.issueRepo.DeleteByID(tx, issue.ID)
	})

	if err != nil {
		return err
	}

	return nil
}

func (s *IssueService) prepare(userID string, issue *model.Issue, isCreate bool) error {
	project, err := s.projectRepo.GetIncludeDetail(issue.ProjectID)
	if err != nil {
		return err
	}

	allowed := types.RoleEditor
	if isCreate {
		allowed = types.RoleAdmin
	}

	if err := s.userRepo.ValidatePermission(userID, project.ID, allowed); err != nil {
		return err
	}

	if isCreate {
		if issue.Parents == nil &&
			project.Setting.RequireDescription &&
			issue.Description == nil {
			return fmt.Errorf("description required")
		}

		if issue.AssigneeID == nil {
			assignID, err := s.GetAssigment(issue, project)
			if err != nil {
				return err
			}
			issue.AssigneeID = assignID
		}

		order, err := s.issueRepo.GetSequence(project.ID, issue.Parents)
		if err != nil {
			return err
		}
		issue.Order = order

		if issue.Type == "" && issue.Parents != nil {
			issue.Type = types.IssueTypeSubtask
		}

		if issue.Priority == "" {
			issue.Priority = project.Setting.DefaultIssuePriority
		}

		if issue.Status == "" {
			issue.Status = project.Setting.DefaultIssueStatus
		}
	}

	return nil
}

func (s *IssueService) random(users []model.User) *string {
	if len(users) == 0 {
		return nil
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	randomIndex := rng.Intn(len(users))
	return &users[randomIndex].ID
}

func (s *IssueService) raoundRobin(project *model.Project, users []model.User) (*string, error) {
	if len(users) == 0 {
		return nil, nil
	}

	currentIndex := 0
	if project.LastAssignedIndex != nil {
		currentIndex = *project.LastAssignedIndex
	} else {
		currentIndex = -1
	}

	nextIndex := (currentIndex + 1) % len(users)

	if err := s.projectRepo.UpdateLastAssigned(
		project.ID, nextIndex); err != nil {
		return nil, err
	}

	return &users[nextIndex].ID, nil
}

func (s *IssueService) leastBusy(users []model.User) (*string, error) {
	if len(users) == 0 {
		return nil, nil
	}

	var counts []schemas.IssueCount

	for _, user := range users {
		count, err := s.issueRepo.CountByUser(user.ID, types.IssueStatusDone)
		if err != nil {
			return nil, err
		}

		counts = append(counts, schemas.IssueCount{
			UserID: user.ID,
			Count:  int(count),
		})
	}

	if len(counts) == 0 {
		return nil, nil
	}

	minUser := counts[0]
	for _, count := range counts[1:] {
		if count.Count < minUser.Count {
			minUser = count
		}
	}

	return &minUser.UserID, nil
}
