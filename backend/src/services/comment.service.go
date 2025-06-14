package services

import (
	"fmt"
	"webservices/src/model"
	"webservices/src/repo"
	"webservices/src/types"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CommentService struct {
	userRepo     *repo.UserRepository
	commentRepo  *repo.CommentRepository
	issueRepo    *repo.IssueRepository
	activityRepo *repo.ActivityRepository
}

func NewCommentService(
	userRepo *repo.UserRepository,
	commentRepo *repo.CommentRepository,
	issueRepo *repo.IssueRepository,
	activityRepo *repo.ActivityRepository,
) *CommentService {
	return &CommentService{
		userRepo:     userRepo,
		commentRepo:  commentRepo,
		issueRepo:    issueRepo,
		activityRepo: activityRepo,
	}
}

func (s *CommentService) GetByIssue(issueID string) ([]model.Comment, error) {
	return s.commentRepo.GetByIssueID(issueID)
}

func (s *CommentService) Create(userID, issueID, message string) (*model.Comment, error) {
	issue, err := s.issueRepo.GetByID(issueID)
	if err != nil {
		return nil, err
	}

	comment := model.Comment{
		UserID:  userID,
		IssueID: issue.ID,
		Message: message,
	}

	err = s.commentRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.commentRepo.CreateTx(tx, &comment); err != nil {
			return err
		}

		user, err := s.userRepo.GetByID(comment.UserID)
		if err != nil {
			return err
		}
		comment.User = *user

		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &issue.ProjectID,
			IssueID:      &issue.ID,
			CommentID:    &comment.ID,
			ActivityType: types.CommentCreate,
			NewValues: &datatypes.JSONMap{
				"message":     comment.Message,
				"author_id":   userID,
				"issue_title": issue.Title,
			},
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	s.issueRepo.Heartbeat(issue.ID)

	return &comment, nil
}

func (s *CommentService) Update(ID, userID, message string) (*model.Comment, error) {
	comment, err := s.commentRepo.GetByID(ID)
	if err != nil {
		return nil, err
	}

	if comment.UserID != userID {
		return nil, fmt.Errorf("you can only update your own comments")
	}

	err = s.commentRepo.DB().Transaction(func(tx *gorm.DB) error {
		comment.Message = message
		if err := s.commentRepo.UpdateTx(tx, comment); err != nil {
			return err
		}

		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &comment.Issue.ProjectID,
			IssueID:      &comment.Issue.ID,
			CommentID:    &comment.ID,
			ActivityType: types.CommentUpdate,
			OldValues:    &datatypes.JSONMap{"message": comment.Message},
			NewValues:    &datatypes.JSONMap{"message": message},
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return comment, nil
}

func (s *CommentService) Delete(ID, userID string) (*model.Comment, error) {
	comment, err := s.commentRepo.GetByID(ID)
	if err != nil {
		return nil, err
	}

	if comment.UserID != userID {
		return nil, fmt.Errorf("you can only delete your own comments")
	}

	activity := model.RecentActivity{
		UserID:       userID,
		ProjectID:    &comment.Issue.ProjectID,
		IssueID:      &comment.Issue.ID,
		CommentID:    &comment.ID,
		ActivityType: types.CommentDelete,
		OldValues: &datatypes.JSONMap{
			"message":     comment.Message,
			"issue_title": comment.Issue.Title,
			"author_id":   comment.UserID,
			"created_at":  comment.CreatedAt,
		},
	}

	err = s.commentRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.activityRepo.CreateTx(tx, &activity); err != nil {
			return err
		}

		return s.commentRepo.DeleteTx(tx, comment.ID)
	})

	if err != nil {
		return nil, err
	}

	return comment, nil
}
