package services

import (
	"webservices/src/model"
	"webservices/src/repo"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type IssueItemService struct {
	itemRepo     *repo.IssueItemRepository
	issueRepo    *repo.IssueRepository
	userRepo     *repo.UserRepository
	activityRepo *repo.ActivityRepository
}

func NewIssueItemService(
	itemRepo *repo.IssueItemRepository,
	issueRepo *repo.IssueRepository,
	userRepo *repo.UserRepository,
	activityRepo *repo.ActivityRepository,
) *IssueItemService {
	return &IssueItemService{
		itemRepo:     itemRepo,
		issueRepo:    issueRepo,
		userRepo:     userRepo,
		activityRepo: activityRepo,
	}
}

func (s *IssueItemService) GetByIssue(ID string) ([]model.IssueItem, error) {
	return s.itemRepo.GetByIssueID(ID)
}

func (s *IssueItemService) Create(userID, issueID string, value schemas.CreateItem) (*model.IssueItem, error) {
	issue, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		issue.ProjectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	item := model.IssueItem{
		IssueID:  issue.ID,
		Type:     value.Type,
		AssetID:  value.AssetID,
		PublicID: value.PublicID,
		Url:      value.Url,
		Text:     value.Text,
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &issue.ProjectID,
		IssueID:      &issue.ID,
		ActivityType: types.IssueItemCreate,
		NewValues: &datatypes.JSONMap{
			"type":      item.Type,
			"asset_id":  item.AssetID,
			"public_id": item.PublicID,
			"text":      item.Text,
		},
	}

	err = s.itemRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.itemRepo.CreateTx(tx, &item); err != nil {
			return err
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	s.issueRepo.Heartbeat(issue.ID)

	return &item, nil
}

func (s *IssueItemService) Update(ID, userID, issueID string, value schemas.CreateItem) (*model.IssueItem, error) {
	item, err := s.itemRepo.GetByID(ID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		item.Issue.ProjectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &item.Issue.ProjectID,
		IssueID:      &item.IssueID,
		ActivityType: types.IssueItemUpdate,
		OldValues: &datatypes.JSONMap{
			"type":      item.Type,
			"asset_id":  item.AssetID,
			"public_id": item.PublicID,
			"text":      item.Text,
		},
	}

	item.Type = value.Type
	item.AssetID = value.AssetID
	item.PublicID = value.PublicID
	item.Url = value.Url
	item.Text = value.Text

	err = s.itemRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.itemRepo.UpdateTx(tx, item); err != nil {
			return err
		}

		activity.NewValues = &datatypes.JSONMap{
			"type":      item.Type,
			"asset_id":  item.AssetID,
			"public_id": item.PublicID,
			"text":      item.Text,
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	s.issueRepo.Heartbeat(item.IssueID)

	return item, nil
}

func (s *IssueItemService) Delete(ID, userID string) (*model.IssueItem, error) {
	item, err := s.itemRepo.GetByID(ID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		item.Issue.ProjectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &item.Issue.ProjectID,
		IssueID:      &item.IssueID,
		ActivityType: types.IssueItemDelete,
		OldValues: &datatypes.JSONMap{
			"type":      item.Type,
			"asset_id":  item.AssetID,
			"public_id": item.PublicID,
			"text":      item.Text,
		},
	}

	err = s.itemRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.itemRepo.DeleteTx(tx, item.ID); err != nil {
			return err
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	s.issueRepo.Heartbeat(item.IssueID)

	return item, nil
}
