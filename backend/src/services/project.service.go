package services

import (
	"fmt"
	"webservices/src/model"
	c "webservices/src/pkg/common"
	"webservices/src/pkg/logger"
	"webservices/src/repo"
	"webservices/src/types"
	"webservices/src/types/schemas"

	"github.com/zishang520/socket.io/v2/socket"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ProjectService struct {
	*baseService
	userRepo        *repo.UserRepository
	projectRepo     *repo.ProjectRepository
	settingRepo     *repo.ProjectSettingRepository
	activityRepo    *repo.ActivityRepository
	userProjectRepo *repo.UserProjectRepository
}

func NewProjectService(
	io *socket.Server,
	userRepo *repo.UserRepository,
	projectRepo *repo.ProjectRepository,
	settingRepo *repo.ProjectSettingRepository,
	activityRepo *repo.ActivityRepository,
	userProjectRepo *repo.UserProjectRepository,
) *ProjectService {
	return &ProjectService{
		baseService:     newBaseService(io),
		userRepo:        userRepo,
		projectRepo:     projectRepo,
		settingRepo:     settingRepo,
		activityRepo:    activityRepo,
		userProjectRepo: userProjectRepo,
	}
}

func (s *ProjectService) GetProjects(userID string, filter schemas.FilterProject) ([]model.Project, error) {
	return s.projectRepo.GetWithFilterByUserID(userID, filter)
}

func (s *ProjectService) GetIncludeUsers(userID, projectID string) (*model.Project, error) {
	return s.projectRepo.GetIncludeUsers(projectID, userID)
}

func (s *ProjectService) Create(userID, name string, image, color, desc *string) (*model.Project, error) {
	project := model.Project{
		Name:        name,
		Image:       image,
		Color:       color,
		Description: desc,
		OwnerID:     userID,
		Setting:     &model.ProjectSetting{},
	}

	project.Users = append(project.Users, model.User{ID: userID})

	err := s.projectRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.projectRepo.SaveTx(tx, &project); err != nil {
			return fmt.Errorf("failed to create project: %w", err)
		}

		if err := s.userRepo.SwitchProjectTx(
			tx, userID, project.ID); err != nil {
			return err
		}

		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &project.ID,
			ActivityType: types.ProjectCreate,
			NewValues: &datatypes.JSONMap{
				"name":        project.Name,
				"image":       project.Image,
				"color":       project.Color,
				"description": project.Description,
			},
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return s.projectRepo.GetIncludeUsers(project.ID, userID)
}

func (s *ProjectService) Update(userID, projectID, name string, image, color, desc *string) (*model.Project, error) {
	if err := s.userRepo.ValidatePermission(userID,
		projectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	project, err := s.projectRepo.GetByID(projectID)
	if err != nil {
		return nil, err
	}

	err = s.projectRepo.DB().Transaction(func(tx *gorm.DB) error {
		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &project.ID,
			ActivityType: types.ProjectUpdate,
			NewValues: &datatypes.JSONMap{
				"name":        project.Name,
				"image":       project.Image,
				"color":       project.Color,
				"description": project.Description,
			},
		}

		project.Name = name
		project.Image = image
		project.Color = color
		project.Description = desc

		if err := s.projectRepo.SaveTx(tx, project); err != nil {
			return fmt.Errorf("failed to update project: %w", err)
		}

		project, err = s.projectRepo.GetIncludeDetailTx(tx, project.ID)
		if err != nil {
			return err
		}

		activity.NewValues = &datatypes.JSONMap{
			"name":        project.Name,
			"image":       project.Image,
			"color":       project.Color,
			"description": project.Description,
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return project, nil
}

func (s *ProjectService) UpdateUserProject(userID, projectID string) (*model.Project, error) {
	project, err := s.projectRepo.GetIncludeUsers(projectID, userID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.SwitchProject(userID, project.ID); err != nil {
		return nil, err
	}

	return project, nil
}

func (s *ProjectService) UpdateSetting(userID, projectID string, values map[string]any) (*model.ProjectSetting, error) {
	delete(values, "projectId")
	if len(values) == 0 {
		return nil, fmt.Errorf("nothing has changed")
	}

	if err := s.userRepo.ValidatePermission(userID,
		projectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	return s.settingRepo.Updates(projectID, c.Apply(schemas.SettingMap, values))
}

func (s *ProjectService) UpdateRole(projectID, writerID, targetID string, role types.UserProjectRole) (*model.UserProject, error) {
	if err := s.userRepo.ValidatePermission(writerID,
		projectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	// need check manualy, because when the owner has change owner role (like transfer project)

	target, err := s.userProjectRepo.Get(projectID, targetID)
	if err != nil {
		return nil, err
	}

	if target.Role == types.RoleOwner {
		return nil, fmt.Errorf("permission denied: cant change the project owner")
	}

	activity := model.RecentActivity{
		UserID:       writerID,
		ProjectID:    &projectID,
		ActivityType: types.UserProjectUpdate,
		OldValues: &datatypes.JSONMap{
			"user_id": targetID,
			"role":    target.Role,
		},
	}

	err = s.projectRepo.DB().Transaction(func(tx *gorm.DB) error {
		target.Role = role
		if err := s.userProjectRepo.UpdateTx(tx, target); err != nil {
			return err
		}

		activity.NewValues = &datatypes.JSONMap{
			"user_id": targetID,
			"role":    target.Role,
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return target, nil
}

func (s *ProjectService) RemoveFromTeam(projectID, writerID, teamID string) (*model.UserProject, error) {
	if err := s.userRepo.ValidatePermission(writerID,
		projectID, types.RoleAdmin); err != nil {
		return nil, err
	}

	team, err := s.userProjectRepo.Get(projectID, teamID)
	if err != nil {
		return nil, err
	}

	activity := model.RecentActivity{
		UserID:       writerID,
		ProjectID:    &projectID,
		ActivityType: types.UserProjectDelete,
		NewValues: &datatypes.JSONMap{
			"user_id": teamID,
			"role":    team.Role,
		},
	}

	err = s.projectRepo.DB().Transaction(func(tx *gorm.DB) error {
		if err := s.userProjectRepo.DeleteTx(tx, team); err != nil {
			return err
		}

		return s.activityRepo.CreateTx(tx, &activity)
	})

	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *ProjectService) Delete(userID, projectID string) (*model.Project, error) {
	project, err := s.projectRepo.GetByID(projectID)
	if err != nil {
		return nil, err
	}

	if err := s.userRepo.ValidatePermission(userID,
		project.ID, types.RoleOwner); err != nil {
		return nil, err
	}

	replacment := s.projectRepo.GetReplacment(project.ID, userID)

	err = s.projectRepo.DB().Transaction(func(tx *gorm.DB) error {
		activity := model.RecentActivity{
			UserID:       userID,
			ProjectID:    &project.ID,
			ActivityType: types.ProjectDelete,
			OldValues: &datatypes.JSONMap{
				"name":        project.Name,
				"image":       project.Image,
				"color":       project.Color,
				"description": project.Description,
				"users":       project.Users,
				"settings":    project.Setting,
			},
		}

		if err := s.activityRepo.CreateTx(tx, &activity); err != nil {
			return err
		}

		if replacment != nil {
			if err := s.userRepo.SwitchProjectTx(
				tx, userID, replacment.ID); err != nil {
				return err
			}
		}

		return s.projectRepo.DeleteTx(tx, project.ID)
	})

	if err != nil {
		return nil, err
	}

	return replacment, nil
}

func (s *ProjectService) GetInvitePayload(projectID, email string) (*model.Project, *model.User, error) {
	project, err := s.projectRepo.GetByID(projectID)
	if err != nil {
		return nil, nil, err
	}

	receiver, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, nil, err
	}

	if err := s.userProjectRepo.Check(project.ID, receiver.ID); err != nil {
		return nil, nil, err
	}

	return project, receiver, nil
}

func (s *ProjectService) CreateUserProject(projectID, email string, role types.UserProjectRole) (*model.Project, error) {
	project, user, err := s.GetInvitePayload(projectID, email)
	if err != nil {
		return nil, err
	}

	member := model.UserProject{
		UserID:    user.ID,
		ProjectID: project.ID,
		Role:      role,
	}

	if err := s.userProjectRepo.Create(&member); err != nil {
		return nil, err
	}

	// switch project trigger
	go func() {
		ids, err := s.userProjectRepo.GetUserIDs(project.ID)
		if err != nil {
			logger.Error(err)
		}

		for _, id := range ids {
			if id != user.ID {
				s.emit(id, "project:update", project.ID)
			}
		}

		s.emit(user.ID, "project:switch", project.ID)
	}()

	return project, nil
}
